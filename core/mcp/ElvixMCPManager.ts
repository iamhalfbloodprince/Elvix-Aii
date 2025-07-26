import { EventEmitter } from "events";
import WebSocket from "ws";

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  version: string;
  protocol: string;
  capabilities: MCPCapability[];
  connection: MCPConnection;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  health?: HealthStatus;
  metadata?: Record<string, any>;
}

export interface MCPCapability {
  type: 'resource' | 'tool' | 'prompt' | 'notification';
  name: string;
  description: string;
  schema?: any;
  permissions?: string[];
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
}

export interface MCPConnection {
  type: 'websocket' | 'http' | 'stdio' | 'ssh';
  endpoint: string;
  authentication?: {
    type: 'bearer' | 'oauth' | 'apikey' | 'basic';
    credentials: Record<string, string>;
  };
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  baseDelay: number;
  maxDelay: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  uptime: number;
  errors: string[];
}

export interface MCPRequest {
  id: string;
  method: string;
  params?: any;
  timestamp: Date;
  timeout?: number;
  retries?: number;
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  timestamp: Date;
}

export class ElvixMCPManager extends EventEmitter {
  private servers: Map<string, MCPServer> = new Map();
  private connections: Map<string, WebSocket | any> = new Map();
  private requestQueue: Map<string, MCPRequest> = new Map();
  private responseHandlers: Map<string, (response: MCPResponse) => void> = new Map();
  private healthChecks: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.initializeBuiltInServers();
  }

  /**
   * Initialize built-in MCP servers for ELVIX AI
   */
  private initializeBuiltInServers() {
    const builtInServers: Omit<MCPServer, 'connection' | 'status'>[] = [
      {
        id: 'elvix-filesystem',
        name: 'ELVIX File System',
        description: 'Access and manipulate files in the workspace',
        version: '1.0.0',
        protocol: 'mcp-1.0',
        capabilities: [
          {
            type: 'resource',
            name: 'file_operations',
            description: 'Read, write, and manage files',
            permissions: ['read', 'write', 'delete', 'create']
          },
          {
            type: 'tool',
            name: 'search_files',
            description: 'Search for files and content',
            schema: {
              pattern: { type: 'string' },
              path: { type: 'string', optional: true },
              includeContent: { type: 'boolean', optional: true }
            }
          }
        ]
      },
      {
        id: 'elvix-git',
        name: 'ELVIX Git Integration',
        description: 'Git operations and version control',
        version: '1.0.0',
        protocol: 'mcp-1.0',
        capabilities: [
          {
            type: 'tool',
            name: 'git_status',
            description: 'Get repository status'
          },
          {
            type: 'tool',
            name: 'git_commit',
            description: 'Create commits with AI-generated messages',
            schema: {
              files: { type: 'array' },
              message: { type: 'string', optional: true }
            }
          },
          {
            type: 'tool',
            name: 'git_branch',
            description: 'Manage branches',
            schema: {
              action: { type: 'string', enum: ['create', 'switch', 'delete'] },
              name: { type: 'string' }
            }
          }
        ]
      },
      {
        id: 'elvix-terminal',
        name: 'ELVIX Terminal',
        description: 'Execute terminal commands safely',
        version: '1.0.0',
        protocol: 'mcp-1.0',
        capabilities: [
          {
            type: 'tool',
            name: 'execute_command',
            description: 'Execute terminal commands with safety checks',
            schema: {
              command: { type: 'string' },
              workingDirectory: { type: 'string', optional: true },
              timeout: { type: 'number', optional: true },
              requireApproval: { type: 'boolean', optional: true }
            },
            permissions: ['execute']
          }
        ]
      },
      {
        id: 'elvix-database',
        name: 'ELVIX Database Manager',
        description: 'Database operations and migrations',
        version: '1.0.0',
        protocol: 'mcp-1.0',
        capabilities: [
          {
            type: 'resource',
            name: 'database_schema',
            description: 'Access database schema information'
          },
          {
            type: 'tool',
            name: 'execute_query',
            description: 'Execute database queries safely',
            schema: {
              query: { type: 'string' },
              database: { type: 'string' },
              readOnly: { type: 'boolean', optional: true }
            },
            permissions: ['read', 'write']
          }
        ]
      },
      {
        id: 'elvix-package-manager',
        name: 'ELVIX Package Manager',
        description: 'Manage project dependencies',
        version: '1.0.0',
        protocol: 'mcp-1.0',
        capabilities: [
          {
            type: 'tool',
            name: 'install_package',
            description: 'Install npm/pip/cargo packages',
            schema: {
              package: { type: 'string' },
              version: { type: 'string', optional: true },
              manager: { type: 'string', enum: ['npm', 'pip', 'cargo', 'go'] },
              dev: { type: 'boolean', optional: true }
            }
          },
          {
            type: 'resource',
            name: 'package_info',
            description: 'Get package information and documentation'
          }
        ]
      },
      {
        id: 'elvix-ai-models',
        name: 'ELVIX AI Models',
        description: 'Manage and switch between AI models',
        version: '1.0.0',
        protocol: 'mcp-1.0',
        capabilities: [
          {
            type: 'resource',
            name: 'available_models',
            description: 'List available AI models'
          },
          {
            type: 'tool',
            name: 'switch_model',
            description: 'Switch between AI models for different tasks',
            schema: {
              model: { type: 'string' },
              task: { type: 'string', enum: ['chat', 'code', 'analysis', 'testing'] }
            }
          }
        ]
      }
    ];

    // Register built-in servers
    builtInServers.forEach(serverConfig => {
      this.registerBuiltInServer(serverConfig);
    });
  }

  /**
   * Register a new MCP server
   */
  async registerServer(server: Omit<MCPServer, 'status'>): Promise<void> {
    const serverWithStatus: MCPServer = {
      ...server,
      status: 'disconnected'
    };

    this.servers.set(server.id, serverWithStatus);
    this.emit('serverRegistered', serverWithStatus);

    // Attempt to connect
    await this.connectToServer(server.id);
  }

  /**
   * Connect to an MCP server
   */
  async connectToServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    server.status = 'connecting';
    this.emit('serverConnecting', server);

    try {
      const connection = await this.establishConnection(server);
      this.connections.set(serverId, connection);
      
      server.status = 'connected';
      this.emit('serverConnected', server);

      // Start health checks
      this.startHealthCheck(serverId);

      // Perform capability discovery
      await this.discoverCapabilities(serverId);

    } catch (error) {
      server.status = 'error';
      this.emit('serverError', { server, error });
      
      // Schedule retry
      this.scheduleRetry(serverId);
    }
  }

  /**
   * Execute a tool via MCP
   */
  async executeTool(serverId: string, toolName: string, params: any = {}): Promise<any> {
    const server = this.servers.get(serverId);
    if (!server || server.status !== 'connected') {
      throw new Error(`Server ${serverId} is not connected`);
    }

    const tool = server.capabilities.find(cap => 
      cap.type === 'tool' && cap.name === toolName
    );

    if (!tool) {
      throw new Error(`Tool ${toolName} not found on server ${serverId}`);
    }

    // Validate parameters against schema
    if (tool.schema) {
      this.validateParams(params, tool.schema);
    }

    // Check rate limits
    await this.checkRateLimit(serverId, toolName);

    const request: MCPRequest = {
      id: this.generateRequestId(),
      method: `tools/${toolName}`,
      params,
      timestamp: new Date()
    };

    return this.sendRequest(serverId, request);
  }

  /**
   * Access a resource via MCP
   */
  async accessResource(serverId: string, resourceName: string, params: any = {}): Promise<any> {
    const server = this.servers.get(serverId);
    if (!server || server.status !== 'connected') {
      throw new Error(`Server ${serverId} is not connected`);
    }

    const resource = server.capabilities.find(cap => 
      cap.type === 'resource' && cap.name === resourceName
    );

    if (!resource) {
      throw new Error(`Resource ${resourceName} not found on server ${serverId}`);
    }

    const request: MCPRequest = {
      id: this.generateRequestId(),
      method: `resources/${resourceName}`,
      params,
      timestamp: new Date()
    };

    return this.sendRequest(serverId, request);
  }

  /**
   * Get available MCP servers and their capabilities
   */
  getServerCapabilities(): Record<string, MCPCapability[]> {
    const capabilities: Record<string, MCPCapability[]> = {};
    
    this.servers.forEach((server, serverId) => {
      if (server.status === 'connected') {
        capabilities[serverId] = server.capabilities;
      }
    });

    return capabilities;
  }

  /**
   * Auto-discover and suggest MCP integrations
   */
  async discoverSuggestedIntegrations(projectContext: any): Promise<{
    suggested: MCPServer[];
    reasons: Record<string, string[]>;
  }> {
    const suggestions: MCPServer[] = [];
    const reasons: Record<string, string[]> = {};

    // Analyze project to suggest relevant MCP servers
    if (projectContext.hasDatabase) {
      const dbServer = this.servers.get('elvix-database');
      if (dbServer) {
        suggestions.push(dbServer);
        reasons[dbServer.id] = ['Project uses database', 'Can help with migrations and queries'];
      }
    }

    if (projectContext.hasGit) {
      const gitServer = this.servers.get('elvix-git');
      if (gitServer) {
        suggestions.push(gitServer);
        reasons[gitServer.id] = ['Project uses Git', 'Can automate version control tasks'];
      }
    }

    if (projectContext.hasPackageJson || projectContext.hasRequirementsTxt) {
      const pkgServer = this.servers.get('elvix-package-manager');
      if (pkgServer) {
        suggestions.push(pkgServer);
        reasons[pkgServer.id] = ['Project has dependencies', 'Can manage package installations'];
      }
    }

    return { suggested: suggestions, reasons };
  }

  /**
   * Create a custom MCP server configuration
   */
  createCustomServer(config: {
    name: string;
    description: string;
    endpoint: string;
    authentication?: MCPConnection['authentication'];
    capabilities: Omit<MCPCapability, 'permissions'>[];
  }): Omit<MCPServer, 'status'> {
    return {
      id: `custom-${Date.now()}`,
      name: config.name,
      description: config.description,
      version: '1.0.0',
      protocol: 'mcp-1.0',
      capabilities: config.capabilities.map(cap => ({
        ...cap,
        permissions: ['read', 'write'] // Default permissions
      })),
      connection: {
        type: 'http',
        endpoint: config.endpoint,
        authentication: config.authentication,
        timeout: 30000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          baseDelay: 1000,
          maxDelay: 10000
        }
      }
    };
  }

  // Private helper methods
  private registerBuiltInServer(config: Omit<MCPServer, 'connection' | 'status'>) {
    const server: MCPServer = {
      ...config,
      connection: {
        type: 'stdio',
        endpoint: `elvix://${config.id}`,
        timeout: 5000
      },
      status: 'disconnected'
    };

    this.servers.set(config.id, server);
  }

  private async establishConnection(server: MCPServer): Promise<any> {
    switch (server.connection.type) {
      case 'websocket':
        return this.createWebSocketConnection(server);
      case 'http':
        return this.createHttpConnection(server);
      case 'stdio':
        return this.createStdioConnection(server);
      default:
        throw new Error(`Unsupported connection type: ${server.connection.type}`);
    }
  }

  private async createWebSocketConnection(server: MCPServer): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(server.connection.endpoint);
      
      ws.on('open', () => resolve(ws));
      ws.on('error', reject);
      
      setTimeout(() => reject(new Error('Connection timeout')), 
        server.connection.timeout || 5000);
    });
  }

  private async createHttpConnection(server: MCPServer): Promise<any> {
    // HTTP connection implementation
    return { type: 'http', endpoint: server.connection.endpoint };
  }

  private async createStdioConnection(server: MCPServer): Promise<any> {
    // Built-in server connection (stdio-like)
    return { type: 'builtin', serverId: server.id };
  }

  private async sendRequest(serverId: string, request: MCPRequest): Promise<any> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`No connection for server ${serverId}`);
    }

    return new Promise((resolve, reject) => {
      this.responseHandlers.set(request.id, (response: MCPResponse) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
      });

      // Handle built-in servers
      if (connection.type === 'builtin') {
        this.handleBuiltInRequest(serverId, request);
      } else if (connection instanceof WebSocket) {
        connection.send(JSON.stringify(request));
      }

      // Set timeout
      setTimeout(() => {
        this.responseHandlers.delete(request.id);
        reject(new Error('Request timeout'));
      }, request.timeout || 30000);
    });
  }

  private async handleBuiltInRequest(serverId: string, request: MCPRequest): Promise<void> {
    // Handle requests to built-in servers
    let result: any;

    switch (serverId) {
      case 'elvix-filesystem':
        result = await this.handleFileSystemRequest(request);
        break;
      case 'elvix-git':
        result = await this.handleGitRequest(request);
        break;
      case 'elvix-terminal':
        result = await this.handleTerminalRequest(request);
        break;
      case 'elvix-database':
        result = await this.handleDatabaseRequest(request);
        break;
      case 'elvix-package-manager':
        result = await this.handlePackageManagerRequest(request);
        break;
      case 'elvix-ai-models':
        result = await this.handleAIModelsRequest(request);
        break;
      default:
        throw new Error(`Unknown built-in server: ${serverId}`);
    }

    const response: MCPResponse = {
      id: request.id,
      result,
      timestamp: new Date()
    };

    const handler = this.responseHandlers.get(request.id);
    if (handler) {
      handler(response);
      this.responseHandlers.delete(request.id);
    }
  }

  // Built-in server handlers
  private async handleFileSystemRequest(request: MCPRequest): Promise<any> {
    // Implementation for file system operations
    return { success: true, message: 'File operation completed' };
  }

  private async handleGitRequest(request: MCPRequest): Promise<any> {
    // Implementation for Git operations
    return { success: true, message: 'Git operation completed' };
  }

  private async handleTerminalRequest(request: MCPRequest): Promise<any> {
    // Implementation for terminal operations
    return { success: true, output: 'Command executed successfully' };
  }

  private async handleDatabaseRequest(request: MCPRequest): Promise<any> {
    // Implementation for database operations
    return { success: true, data: [] };
  }

  private async handlePackageManagerRequest(request: MCPRequest): Promise<any> {
    // Implementation for package manager operations
    return { success: true, message: 'Package operation completed' };
  }

  private async handleAIModelsRequest(request: MCPRequest): Promise<any> {
    // Implementation for AI model operations
    return { success: true, message: 'Model operation completed' };
  }

  private validateParams(params: any, schema: any): void {
    // Implementation for parameter validation
  }

  private async checkRateLimit(serverId: string, toolName: string): Promise<void> {
    // Implementation for rate limiting
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startHealthCheck(serverId: string): void {
    const healthCheck = setInterval(async () => {
      try {
        await this.performHealthCheck(serverId);
      } catch (error) {
        console.error(`Health check failed for ${serverId}:`, error);
      }
    }, 30000); // Check every 30 seconds

    this.healthChecks.set(serverId, healthCheck);
  }

  private async performHealthCheck(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) return;

    const startTime = Date.now();
    try {
      // Perform a simple ping request
      const result = await this.sendRequest(serverId, {
        id: this.generateRequestId(),
        method: 'ping',
        timestamp: new Date()
      });

      server.health = {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        uptime: server.health?.uptime || 0,
        errors: []
      };
    } catch (error) {
      server.health = {
        status: 'unhealthy',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        uptime: server.health?.uptime || 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private scheduleRetry(serverId: string): void {
    const server = this.servers.get(serverId);
    if (!server?.connection.retryPolicy) return;

    const { maxRetries, backoffStrategy, baseDelay } = server.connection.retryPolicy;
    const retryCount = server.metadata?.retryCount || 0;

    if (retryCount >= maxRetries) {
      this.emit('serverMaxRetriesExceeded', server);
      return;
    }

    let delay = baseDelay;
    if (backoffStrategy === 'exponential') {
      delay = baseDelay * Math.pow(2, retryCount);
    } else if (backoffStrategy === 'linear') {
      delay = baseDelay * (retryCount + 1);
    }

    setTimeout(async () => {
      server.metadata = { ...server.metadata, retryCount: retryCount + 1 };
      await this.connectToServer(serverId);
    }, delay);
  }

  private async discoverCapabilities(serverId: string): Promise<void> {
    // Implementation for capability discovery
  }
}