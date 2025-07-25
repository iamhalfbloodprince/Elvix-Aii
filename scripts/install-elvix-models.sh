#!/bin/bash

# ELVIX AI Local Model Installation Script
# This script helps you set up ELVIX AI with local model support

set -e

echo "🚀 ELVIX AI Local Model Setup"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if running on supported OS
check_os() {
    print_header "Checking operating system..."
    
    case "$(uname -s)" in
        Linux*)     MACHINE=Linux;;
        Darwin*)    MACHINE=Mac;;
        CYGWIN*)    MACHINE=Cygwin;;
        MINGW*)     MACHINE=MinGw;;
        *)          MACHINE="UNKNOWN:$(uname -s)"
    esac
    
    if [[ "$MACHINE" == "UNKNOWN"* ]]; then
        print_error "Unsupported operating system: $MACHINE"
        exit 1
    fi
    
    print_status "Operating system: $MACHINE"
}

# Check system requirements
check_requirements() {
    print_header "Checking system requirements..."
    
    # Check available memory
    if command -v free &> /dev/null; then
        TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.1f", $2/1024}')
        print_status "Available memory: ${TOTAL_MEM}GB"
        
        if (( $(echo "$TOTAL_MEM < 8.0" | bc -l) )); then
            print_warning "Recommended: 8GB+ RAM for optimal performance"
        fi
    elif command -v vm_stat &> /dev/null; then
        # macOS
        TOTAL_MEM=$(echo "$(vm_stat | grep "Pages free" | awk '{print $3}' | tr -d '.') * 4096 / 1024 / 1024 / 1024" | bc -l)
        print_status "Available memory: ${TOTAL_MEM}GB"
    fi
    
    # Check disk space
    AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
    print_status "Available disk space: $AVAILABLE_SPACE"
    
    # Check for GPU (NVIDIA)
    if command -v nvidia-smi &> /dev/null; then
        print_status "NVIDIA GPU detected - will enable GPU acceleration"
        GPU_AVAILABLE=true
    else
        print_warning "No NVIDIA GPU detected - will use CPU mode"
        GPU_AVAILABLE=false
    fi
}

# Install Ollama
install_ollama() {
    print_header "Installing Ollama..."
    
    if command -v ollama &> /dev/null; then
        print_status "Ollama is already installed"
        OLLAMA_VERSION=$(ollama --version)
        print_status "Version: $OLLAMA_VERSION"
    else
        print_status "Installing Ollama..."
        curl -fsSL https://ollama.ai/install.sh | sh
        
        if command -v ollama &> /dev/null; then
            print_status "Ollama installed successfully"
        else
            print_error "Failed to install Ollama"
            exit 1
        fi
    fi
}

# Start Ollama service
start_ollama() {
    print_header "Starting Ollama service..."
    
    # Check if Ollama is already running
    if pgrep -x "ollama" > /dev/null; then
        print_status "Ollama is already running"
    else
        print_status "Starting Ollama service..."
        
        if [[ "$MACHINE" == "Mac" ]]; then
            # macOS
            ollama serve &
        else
            # Linux
            if command -v systemctl &> /dev/null; then
                sudo systemctl start ollama
                sudo systemctl enable ollama
            else
                ollama serve &
            fi
        fi
        
        # Wait for Ollama to start
        print_status "Waiting for Ollama to start..."
        sleep 5
        
        # Verify Ollama is running
        if curl -s http://localhost:11434/api/version > /dev/null; then
            print_status "Ollama started successfully"
        else
            print_error "Failed to start Ollama service"
            exit 1
        fi
    fi
}

# Install recommended models
install_models() {
    print_header "Installing recommended ELVIX AI models..."
    
    MODELS=(
        "qwen2.5-coder:1.5b|Quick autocomplete model|1.5GB"
        "qwen2.5-coder:7b|High-performance coding model|4.2GB"  
        "llama3.1:8b|Latest Llama model for code generation|4.7GB"
    )
    
    echo "Available models:"
    for i in "${!MODELS[@]}"; do
        IFS='|' read -r model desc size <<< "${MODELS[$i]}"
        echo "  $((i+1)). $model - $desc ($size)"
    done
    echo ""
    
    echo "Which models would you like to install?"
    echo "Enter numbers separated by spaces (e.g., '1 2 3' for all):"
    read -r selection
    
    for num in $selection; do
        if [[ "$num" =~ ^[1-3]$ ]]; then
            idx=$((num-1))
            IFS='|' read -r model desc size <<< "${MODELS[$idx]}"
            
            print_status "Installing $model ($size)..."
            
            if ollama list | grep -q "$model"; then
                print_status "$model is already installed"
            else
                ollama pull "$model"
                if ollama list | grep -q "$model"; then
                    print_status "$model installed successfully"
                else
                    print_error "Failed to install $model"
                fi
            fi
        else
            print_warning "Invalid selection: $num"
        fi
    done
}

# Create ELVIX AI configuration
create_config() {
    print_header "Creating ELVIX AI configuration..."
    
    # Default config directory
    if [[ "$MACHINE" == "Mac" ]]; then
        CONFIG_DIR="$HOME/.elvix"
    else
        CONFIG_DIR="$HOME/.config/elvix"
    fi
    
    mkdir -p "$CONFIG_DIR"
    
    # Create config.yaml
    cat > "$CONFIG_DIR/config.yaml" << EOF
# ELVIX AI Configuration
# For more information, visit: https://docs.elvix.ai

models:
  - title: "ELVIX Local Chat"
    provider: "elvix-local"
    model: "llama3.1:8b"
    systemMessage: "You are ELVIX AI, an advanced code assistant that helps developers write better code."
    
  - title: "ELVIX Code Completion"
    provider: "elvix-local"
    model: "qwen2.5-coder:7b"
    roles: ["autocomplete"]

tabAutocompleteModel:
  title: "ELVIX Autocomplete"
  provider: "elvix-local"
  model: "qwen2.5-coder:1.5b"

customCommands:
  - name: "test"
    prompt: "Write comprehensive unit tests for the highlighted code. Include edge cases and error scenarios."
  - name: "optimize"  
    prompt: "Analyze this code for performance optimizations and suggest improvements."
  - name: "document"
    prompt: "Generate comprehensive documentation for this code including JSDoc comments."

contextProviders:
  - name: "diff"
  - name: "open"
  - name: "terminal"
  - name: "problems"
  - name: "folder"
  - name: "codebase"

allowAnonymousTelemetry: false

embeddingsProvider:
  provider: "transformers.js"
  model: "Xenova/all-MiniLM-L6-v2"
EOF
    
    print_status "Configuration created at: $CONFIG_DIR/config.yaml"
}

# Verify installation
verify_installation() {
    print_header "Verifying installation..."
    
    # Check Ollama
    if command -v ollama &> /dev/null; then
        print_status "✓ Ollama installed"
    else
        print_error "✗ Ollama not found"
        return 1
    fi
    
    # Check Ollama service
    if curl -s http://localhost:11434/api/version > /dev/null; then
        print_status "✓ Ollama service running"
    else
        print_error "✗ Ollama service not running"
        return 1
    fi
    
    # Check models
    INSTALLED_MODELS=$(ollama list | grep -v "NAME" | wc -l)
    if [[ $INSTALLED_MODELS -gt 0 ]]; then
        print_status "✓ $INSTALLED_MODELS model(s) installed"
    else
        print_warning "⚠ No models installed"
    fi
    
    print_status "✓ ELVIX AI configuration created"
}

# Show next steps
show_next_steps() {
    print_header "Installation Complete! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Install the ELVIX AI extension in your editor:"
    echo "   - VS Code: Search for 'ELVIX AI' in the extensions marketplace"
    echo "   - JetBrains: Install the ELVIX AI plugin"
    echo ""
    echo "2. The extension will automatically use your local configuration"
    echo ""
    echo "3. Start coding with ELVIX AI!"
    echo "   - Press Cmd/Ctrl+L to open chat"
    echo "   - Press Cmd/Ctrl+I to edit code"
    echo "   - Tab for autocomplete suggestions"
    echo ""
    echo "For more information, visit: https://docs.elvix.ai"
    echo ""
    
    if [[ $GPU_AVAILABLE == true ]]; then
        print_status "GPU acceleration is available for better performance!"
    fi
}

# Main installation flow
main() {
    echo "This script will install ELVIX AI with local model support."
    echo "It will install Ollama and download AI models to your system."
    echo ""
    echo "Continue? (y/N)"
    read -r consent
    
    if [[ ! "$consent" =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
    
    check_os
    check_requirements
    install_ollama
    start_ollama
    install_models
    create_config
    verify_installation
    show_next_steps
}

# Run main function
main "$@"