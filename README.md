<div align="center">

![ELVIX AI logo](media/elvix-readme.png)

</div>

<h1 align="center">ELVIX AI</h1>

<div align="center">

**[ELVIX AI](https://elvix.ai) is the next-generation AI code assistant that enables developers to create, share, and use custom AI coding assistants with our
open-source [VS Code](https://marketplace.visualstudio.com/items?itemName=ElvixAI.elvix-ai)
and [JetBrains](https://plugins.jetbrains.com/plugin/22707-elvix-ai-extension) extensions.
Features powerful offline models including Llama, Code Llama, and other state-of-the-art LLMs for complete privacy and control.**

</div>

<div align="center">

<a target="_blank" href="https://opensource.org/licenses/Apache-2.0" style="background:none">
    <img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" style="height: 22px;" />
</a>
<a target="_blank" href="https://docs.elvix.ai" style="background:none">
    <img src="https://img.shields.io/badge/elvix_ai_docs-%23BE1B55" style="height: 22px;" />
</a>
<a target="_blank" href="https://changelog.elvix.ai" style="background:none">
    <img src="https://img.shields.io/badge/changelog-%96EFF3" style="height: 22px;" />
</a>
<a target="_blank" href="https://discord.gg/elvixai" style="background:none">
    <img src="https://img.shields.io/badge/discord-join-elvix.svg?labelColor=191937&color=6F6FF7&logo=discord" style="height: 22px;" />
</a>

<p></p>

## 🤖 ELVIX AI Agent

[ELVIX Agent](https://elvix.ai/docs/agent/how-to-use-it) enables you to make substantial changes to your codebase with advanced AI reasoning and planning capabilities

![agent](docs/images/agent.gif)

## 💬 Intelligent Chat

[ELVIX Chat](https://elvix.ai/docs/chat/how-to-use-it) provides seamless AI assistance without leaving your IDE, powered by state-of-the-art language models

![chat](docs/images/chat.gif)

## ⚡ Smart Autocomplete

[ELVIX Autocomplete](https://elvix.ai/docs/autocomplete/how-to-use-it) delivers intelligent inline code suggestions as you type, including support for local offline models

![autocomplete](docs/images/autocomplete.gif)

## ✏️ Contextual Edit

[ELVIX Edit](https://elvix.ai/docs/edit/how-to-use-it) allows you to modify code contextually without leaving your current file

![edit](docs/images/edit.gif)

## 🔒 Offline Model Support

**NEW in ELVIX AI:** Complete privacy with local model execution:
- **Llama 3.1/3.2** - Latest Llama models for code generation
- **Code Llama** - Specialized for programming tasks  
- **Qwen Coder** - High-performance coding model
- **DeepSeek Coder** - Advanced code understanding
- **StarCoder** - Multi-language code completion
- **Mistral** - Fast and efficient reasoning

## 🚀 Enhanced Features

- **Multi-Model Support**: Switch between cloud and local models seamlessly
- **Advanced Context**: Better codebase understanding and context awareness
- **Custom Rules**: Define project-specific coding patterns and guidelines
- **Enhanced Security**: All processing can stay local with offline models
- **Performance Optimized**: Faster response times with local inference
- **Enterprise Ready**: Deploy privately without external dependencies

</div>

## Getting Started

Learn how to install and use ELVIX AI in the docs [here](https://elvix.ai/docs/getting-started/install)

### Quick Setup for Offline Models

1. Install ELVIX AI extension
2. Install Ollama: `curl -fsSL https://ollama.ai/install.sh | sh`
3. Pull a model: `ollama pull llama3.1:8b`
4. Configure ELVIX to use your local model

## Contributing

Read the [contributing guide](https://github.com/elvix-ai/elvix/blob/main/CONTRIBUTING.md), and
join [#contribute on Discord](https://discord.gg/elvixai).

## License

[Apache 2.0 © 2023-2024 ELVIX AI, Inc.](./LICENSE)
