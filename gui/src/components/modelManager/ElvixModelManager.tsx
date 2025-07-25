import React, { useState, useEffect } from 'react';
import { CheckIcon, DownloadIcon, TrashIcon, CpuChipIcon, ServerIcon } from '@heroicons/react/24/outline';

interface ModelInfo {
  name: string;
  size: string;
  description: string;
  recommended: boolean;
  capabilities: string[];
  installed?: boolean;
  downloading?: boolean;
  progress?: number;
}

interface SystemResources {
  memoryTotal: number;
  memoryAvailable: number;
  gpuAvailable: boolean;
  gpuMemory?: number;
}

interface ElvixModelManagerProps {
  onModelSelect?: (model: string) => void;
  currentModel?: string;
}

const ElvixModelManager: React.FC<ElvixModelManagerProps> = ({
  onModelSelect,
  currentModel
}) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [systemResources, setSystemResources] = useState<SystemResources | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'recommended' | 'all' | 'installed'>('recommended');
  const [loading, setLoading] = useState(true);
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadModels();
    loadSystemResources();
  }, []);

  const loadModels = async () => {
    try {
      // This would call the ElvixLocal getRecommendedModels method
      const recommendedModels: ModelInfo[] = [
        {
          name: "llama3.1:8b",
          size: "4.7GB",
          description: "Latest Llama model optimized for code generation",
          recommended: true,
          capabilities: ["chat", "code", "reasoning"],
          installed: false
        },
        {
          name: "codellama:7b",
          size: "3.8GB", 
          description: "Specialized for programming tasks",
          recommended: true,
          capabilities: ["code", "completion", "debugging"],
          installed: false
        },
        {
          name: "qwen2.5-coder:7b",
          size: "4.2GB",
          description: "High-performance coding model",
          recommended: true,
          capabilities: ["code", "completion", "refactoring"],
          installed: true
        },
        {
          name: "deepseek-coder:6.7b",
          size: "3.6GB",
          description: "Advanced code understanding",
          recommended: false,
          capabilities: ["code", "analysis", "documentation"],
          installed: false
        },
        {
          name: "starcoder2:7b",
          size: "4.0GB",
          description: "Multi-language code completion",
          recommended: false,
          capabilities: ["code", "completion", "multilang"],
          installed: false
        },
        {
          name: "mistral:7b",
          size: "4.1GB",
          description: "Fast and efficient reasoning",
          recommended: false,
          capabilities: ["chat", "reasoning", "general"],
          installed: false
        }
      ];
      
      setModels(recommendedModels);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemResources = async () => {
    try {
      // This would call the ElvixLocal getSystemResources method
      const resources: SystemResources = {
        memoryTotal: 16 * 1024 * 1024 * 1024, // 16GB
        memoryAvailable: 8 * 1024 * 1024 * 1024, // 8GB
        gpuAvailable: true,
        gpuMemory: 8 * 1024 * 1024 * 1024, // 8GB
      };
      
      setSystemResources(resources);
    } catch (error) {
      console.error('Failed to load system resources:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleInstallModel = async (modelName: string) => {
    setDownloadingModels(prev => new Set(prev).add(modelName));
    
    try {
      // This would call the ElvixLocal installModel method
      console.log(`Installing model: ${modelName}`);
      
      // Simulate download progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setModels(prev => 
          prev.map(model => 
            model.name === modelName 
              ? { ...model, downloading: true, progress }
              : model
          )
        );
      }
      
      // Mark as installed
      setModels(prev => 
        prev.map(model => 
          model.name === modelName 
            ? { ...model, installed: true, downloading: false, progress: undefined }
            : model
        )
      );
    } catch (error) {
      console.error(`Failed to install model ${modelName}:`, error);
    } finally {
      setDownloadingModels(prev => {
        const next = new Set(prev);
        next.delete(modelName);
        return next;
      });
    }
  };

  const handleUninstallModel = async (modelName: string) => {
    try {
      // This would call the ElvixLocal deleteModel method
      console.log(`Uninstalling model: ${modelName}`);
      
      setModels(prev => 
        prev.map(model => 
          model.name === modelName 
            ? { ...model, installed: false }
            : model
        )
      );
    } catch (error) {
      console.error(`Failed to uninstall model ${modelName}:`, error);
    }
  };

  const filteredModels = models.filter(model => {
    switch (selectedCategory) {
      case 'recommended':
        return model.recommended;
      case 'installed':
        return model.installed;
      case 'all':
      default:
        return true;
    }
  });

  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case 'code':
        return '🚀';
      case 'chat':
        return '💬';
      case 'reasoning':
        return '🧠';
      case 'completion':
        return '⚡';
      case 'debugging':
        return '🐛';
      case 'refactoring':
        return '🔧';
      case 'analysis':
        return '📊';
      case 'documentation':
        return '📝';
      case 'multilang':
        return '🌐';
      case 'general':
        return '🎯';
      default:
        return '✨';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading models...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          ELVIX AI Model Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your local AI models for enhanced privacy and performance
        </p>
      </div>

      {/* System Resources */}
      {systemResources && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3 flex items-center">
            <CpuChipIcon className="h-5 w-5 mr-2" />
            System Resources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Memory:</span>
              <div className="font-mono">
                {formatBytes(systemResources.memoryAvailable)} / {formatBytes(systemResources.memoryTotal)}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">GPU:</span>
              <div className="font-mono">
                {systemResources.gpuAvailable ? 
                  `Available (${formatBytes(systemResources.gpuMemory || 0)})` : 
                  'Not Available'
                }
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <div className="text-green-600 dark:text-green-400">Ready for Local Models</div>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
        {[
          { key: 'recommended', label: 'Recommended', count: models.filter(m => m.recommended).length },
          { key: 'installed', label: 'Installed', count: models.filter(m => m.installed).length },
          { key: 'all', label: 'All Models', count: models.length }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key as any)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedCategory === key
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((model) => (
          <div
            key={model.name}
            className={`border rounded-lg p-4 transition-all ${
              currentModel === model.name
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {model.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {model.size}
                </p>
              </div>
              {model.recommended && (
                <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-1 rounded-full">
                  Recommended
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {model.description}
            </p>

            {/* Capabilities */}
            <div className="flex flex-wrap gap-1 mb-4">
              {model.capabilities.map((capability) => (
                <span
                  key={capability}
                  className="inline-flex items-center text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                >
                  <span className="mr-1">{getCapabilityIcon(capability)}</span>
                  {capability}
                </span>
              ))}
            </div>

            {/* Download Progress */}
            {model.downloading && model.progress !== undefined && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Downloading...</span>
                  <span>{model.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${model.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {model.installed ? (
                <>
                  <button
                    onClick={() => onModelSelect?.(model.name)}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      currentModel === model.name
                        ? 'bg-blue-500 text-white'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                    }`}
                  >
                    <CheckIcon className="h-4 w-4 inline mr-1" />
                    {currentModel === model.name ? 'Active' : 'Use Model'}
                  </button>
                  <button
                    onClick={() => handleUninstallModel(model.name)}
                    className="px-3 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleInstallModel(model.name)}
                  disabled={model.downloading}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <DownloadIcon className="h-4 w-4 inline mr-1" />
                  {model.downloading ? 'Installing...' : 'Install'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredModels.length === 0 && (
        <div className="text-center py-8">
          <ServerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No models found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {selectedCategory === 'installed' 
              ? 'No models are currently installed. Install some models to get started.'
              : 'No models available in this category.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ElvixModelManager;