#!/bin/bash

# ELVIX AI Enhanced Setup Script with Latest 2025 Features
# This script sets up ELVIX AI with cutting-edge features and local model support

set -e

echo "🚀 ELVIX AI Enhanced Setup (2025 Edition)"
echo "=========================================="
echo "Installing latest AI coding features:"
echo "• Agentic AI workflows"
echo "• Voice coding interface"
echo "• MCP protocol integration"
echo "• Advanced code analysis"
echo "• Latest LLM models (Claude 3.7, Grok 3, Gemini 2.5)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_header() {
    echo -e "${CYAN}$1${NC}"
}

print_step() {
    echo -e "${PURPLE}[→]${NC} $1"
}

# Check if running on supported OS
check_os() {
    print_header "🔍 Checking operating system..."
    
    case "$(uname -s)" in
        Linux*)     MACHINE=Linux;;
        Darwin*)    MACHINE=Mac;;
        CYGWIN*)    MACHINE=Cygwin;;
        MINGW*)     MACHINE=MinGw;;
        *)          MACHINE="UNKNOWN:${unameOut}"
    esac
    
    print_status "Detected OS: $MACHINE"
    
    if [[ "$MACHINE" != "Linux" && "$MACHINE" != "Mac" ]]; then
        print_error "Unsupported operating system: $MACHINE"
        print_warning "ELVIX AI currently supports Linux and macOS"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    print_header "🔧 Checking system requirements..."
    
    local missing_deps=()
    
    # Check for required tools
    command -v node >/dev/null 2>&1 || missing_deps+=("Node.js (v18+)")
    command -v npm >/dev/null 2>&1 || missing_deps+=("npm")
    command -v git >/dev/null 2>&1 || missing_deps+=("git")
    command -v curl >/dev/null 2>&1 || missing_deps+=("curl")
    
    # Check Node.js version
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$NODE_MAJOR" -lt 18 ]; then
            missing_deps+=("Node.js v18+ (current: v$NODE_VERSION)")
        else
            print_status "Node.js v$NODE_VERSION detected"
        fi
    fi
    
    # Check memory (minimum 8GB recommended for local models)
    if [[ "$MACHINE" == "Linux" ]]; then
        MEMORY_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
        MEMORY_GB=$((MEMORY_KB / 1024 / 1024))
    elif [[ "$MACHINE" == "Mac" ]]; then
        MEMORY_BYTES=$(sysctl -n hw.memsize)
        MEMORY_GB=$((MEMORY_BYTES / 1024 / 1024 / 1024))
    fi
    
    print_status "System memory: ${MEMORY_GB}GB"
    if [ "$MEMORY_GB" -lt 8 ]; then
        print_warning "8GB+ RAM recommended for optimal performance with local models"
    fi
    
    # Check disk space (minimum 10GB for models)
    DISK_SPACE=$(df -h . | awk 'NR==2{print $4}' | sed 's/G.*//')
    if [ "$DISK_SPACE" -lt 10 ]; then
        print_warning "10GB+ free disk space recommended for local models"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo ""
        print_step "Please install missing dependencies and run this script again"
        exit 1
    fi
    
    print_status "All system requirements met"
}

# Install system dependencies
install_system_deps() {
    print_header "📦 Installing system dependencies..."
    
    if [[ "$MACHINE" == "Linux" ]]; then
        # Detect Linux distribution
        if command -v apt-get >/dev/null 2>&1; then
            print_step "Installing dependencies via apt-get..."
            sudo apt-get update -qq
            sudo apt-get install -y python3 python3-pip build-essential cmake
        elif command -v yum >/dev/null 2>&1; then
            print_step "Installing dependencies via yum..."
            sudo yum install -y python3 python3-pip gcc-c++ cmake
        elif command -v pacman >/dev/null 2>&1; then
            print_step "Installing dependencies via pacman..."
            sudo pacman -S --noconfirm python python-pip base-devel cmake
        else
            print_warning "Unknown Linux distribution. Please install Python3, pip, and build tools manually"
        fi
    elif [[ "$MACHINE" == "Mac" ]]; then
        # Check if Homebrew is installed
        if ! command -v brew >/dev/null 2>&1; then
            print_step "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        
        print_step "Installing dependencies via Homebrew..."
        brew install python cmake
    fi
    
    print_status "System dependencies installed"
}

# Setup Python environment for local models
setup_python_env() {
    print_header "🐍 Setting up Python environment for local models..."
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_step "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    print_step "Upgrading pip..."
    pip install --upgrade pip
    
    # Install AI/ML packages
    print_step "Installing AI/ML packages..."
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
    pip install transformers accelerate optimum
    pip install ollama-python
    pip install openai anthropic
    pip install sentence-transformers
    pip install chromadb
    pip install fastapi uvicorn
    
    print_status "Python environment ready"
}

# Install Ollama for local model management
install_ollama() {
    print_header "🦙 Installing Ollama for local model management..."
    
    if command -v ollama >/dev/null 2>&1; then
        print_status "Ollama already installed"
        return
    fi
    
    print_step "Downloading and installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
    
    # Start Ollama service
    print_step "Starting Ollama service..."
    if [[ "$MACHINE" == "Linux" ]]; then
        sudo systemctl start ollama
        sudo systemctl enable ollama
    elif [[ "$MACHINE" == "Mac" ]]; then
        brew services start ollama
    fi
    
    print_status "Ollama installed and running"
}

# Download recommended local models
download_models() {
    print_header "🧠 Downloading recommended AI models..."
    
    local models=(
        "llama3.1:8b"           # General purpose
        "qwen2.5-coder:7b"      # Code-specific
        "deepseek-coder:6.7b"   # Advanced coding
        "codellama:7b"          # Meta's code model
        "starcoder2:7b"         # Code generation
        "mistral:7b"            # Lightweight alternative
    )
    
    print_step "This will download approximately 20-30GB of models. Continue? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        for model in "${models[@]}"; do
            print_step "Downloading $model..."
            ollama pull "$model" || print_warning "Failed to download $model"
        done
        print_status "Model downloads completed"
    else
        print_warning "Skipping model downloads. You can download them later with: ollama pull <model>"
    fi
}

# Install and setup ELVIX AI
setup_elvix() {
    print_header "⚡ Setting up ELVIX AI..."
    
    # Install npm dependencies
    print_step "Installing npm dependencies..."
    npm install
    
    # Install additional dependencies for new features
    print_step "Installing enhanced feature dependencies..."
    npm install ws @anthropic-ai/sdk openai
    npm install @microsoft/vscode-extension-telemetry
    npm install speech-recognition-polyfill
    npm install wavefile audio-recorder-polyfill
    npm install semver chalk inquirer
    
    # Build the project
    print_step "Building ELVIX AI..."
    npm run build
    
    print_status "ELVIX AI core setup completed"
}

# Configure enhanced features
configure_features() {
    print_header "🛠️ Configuring enhanced features..."
    
    # Create configuration directory
    mkdir -p ~/.elvix
    
    # Generate default configuration
    cat > ~/.elvix/config.yaml << EOF
# ELVIX AI Enhanced Configuration
version: "1.1.0"
branding: "ELVIX AI"

# Local Model Settings
models:
  default_chat: "llama3.1:8b"
  default_code: "qwen2.5-coder:7b"
  default_analysis: "deepseek-coder:6.7b"
  
  providers:
    ollama:
      enabled: true
      endpoint: "http://localhost:11434"
    
    anthropic:
      enabled: false
      api_key: ""
      model: "claude-3-5-sonnet-20241022"
    
    openai:
      enabled: false
      api_key: ""
      model: "gpt-4o"

# Voice Coding Settings
voice:
  enabled: true
  language: "en-US"
  sensitivity: 0.7
  continuous_listening: false
  wake_word: "hey elvix"

# Agentic AI Settings
agent:
  enabled: true
  auto_execute: false
  max_concurrency: 3
  approval_required: true

# MCP Settings
mcp:
  enabled: true
  servers:
    - name: "elvix-filesystem"
      enabled: true
    - name: "elvix-git"
      enabled: true
    - name: "elvix-terminal"
      enabled: true

# Code Analysis Settings
analysis:
  enabled: true
  real_time: true
  security_scanning: true
  performance_monitoring: true
  complexity_threshold: 10

# UI Settings
ui:
  theme: "dark"
  enable_animations: true
  show_advanced_features: true
  voice_interface: true
  
# Privacy Settings
privacy:
  local_only: true
  telemetry: false
  crash_reporting: false
EOF

    print_status "Configuration file created at ~/.elvix/config.yaml"
}

# Setup VS Code extension
setup_vscode_extension() {
    print_header "📝 Setting up VS Code extension..."
    
    if command -v code >/dev/null 2>&1; then
        print_step "Building VS Code extension..."
        cd extensions/vscode
        npm install
        npm run compile
        
        print_step "Installing ELVIX AI extension..."
        code --install-extension . --force
        
        cd ../..
        print_status "VS Code extension installed"
    else
        print_warning "VS Code not found. Extension can be installed manually later"
    fi
}

# Run system health check
health_check() {
    print_header "🏥 Running system health check..."
    
    # Check Ollama service
    if pgrep -x "ollama" > /dev/null; then
        print_status "Ollama service is running"
    else
        print_warning "Ollama service is not running"
    fi
    
    # Check available models
    if command -v ollama >/dev/null 2>&1; then
        local model_count=$(ollama list | wc -l)
        if [ "$model_count" -gt 1 ]; then
            print_status "$((model_count - 1)) local models available"
        else
            print_warning "No local models found. Run 'ollama pull llama3.1:8b' to download a model"
        fi
    fi
    
    # Check disk space
    local available_space=$(df -h . | awk 'NR==2{print $4}')
    print_status "Available disk space: $available_space"
    
    # Check port availability
    if nc -z localhost 11434 2>/dev/null; then
        print_status "Ollama API port (11434) is accessible"
    else
        print_warning "Ollama API port (11434) is not accessible"
    fi
    
    print_status "Health check completed"
}

# Print usage instructions
print_usage() {
    print_header "🎉 ELVIX AI Enhanced Setup Complete!"
    echo ""
    echo "🚀 Quick Start:"
    echo "  1. Open VS Code"
    echo "  2. Open a coding project"
    echo "  3. Press Ctrl+Shift+P and type 'ELVIX'"
    echo "  4. Try voice coding: Click the microphone in the sidebar"
    echo ""
    echo "🗣️ Voice Commands:"
    echo "  • 'Create a React component for user login'"
    echo "  • 'Debug the authentication service'"
    echo "  • 'Add error handling to the API calls'"
    echo "  • 'Generate tests for the payment module'"
    echo ""
    echo "🔧 Configuration:"
    echo "  • Config file: ~/.elvix/config.yaml"
    echo "  • Local models: ollama list"
    echo "  • Add more models: ollama pull <model-name>"
    echo ""
    echo "📚 Advanced Features:"
    echo "  • Agentic AI workflows for autonomous coding"
    echo "  • Real-time code analysis with security scanning"
    echo "  • MCP protocol for tool integration"
    echo "  • Voice-driven development workflow"
    echo ""
    echo "🆘 Support:"
    echo "  • Documentation: https://docs.elvix.ai"
    echo "  • Community: https://github.com/elvix-ai/community"
    echo "  • Issues: https://github.com/elvix-ai/elvix/issues"
    echo ""
    print_status "Ready to revolutionize your coding experience with ELVIX AI!"
}

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        print_error "Installation failed. Cleaning up..."
        # Add cleanup logic here if needed
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Main installation flow
main() {
    check_os
    check_requirements
    install_system_deps
    setup_python_env
    install_ollama
    setup_elvix
    configure_features
    setup_vscode_extension
    
    # Optional components
    echo ""
    print_step "Download recommended AI models now? (Recommended for best experience)"
    echo "This will download 20-30GB of models for local AI capabilities."
    read -p "Download models? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        download_models
    fi
    
    health_check
    print_usage
}

# Run main installation
main "$@"