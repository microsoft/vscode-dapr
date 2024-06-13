# Dapr for Visual Studio Code (Preview)

[![Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ms-azuretools.vscode-dapr.svg)](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-dapr)
[![Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/ms-azuretools.vscode-dapr.svg)](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-dapr)
[![Build Status](https://dev.azure.com/devdiv/DevDiv/_apis/build/status%2FAzure%20Tools%2FVSCode%2FExtensions%2Fvscode-dapr%20(1ES)?repoName=microsoft%2Fvscode-dapr&branchName=main)](https://dev.azure.com/devdiv/DevDiv/_build/latest?definitionId=21595&repoName=microsoft%2Fvscode-dapr&branchName=main)

The Dapr extension makes it easy to setup debugging of applications within the Dapr environment as well as interact with applications via the Dapr runtime.

## Prerequisites

### Platforms

Supported platforms:

 - MacOS
 - Linux
 - Windows

> Dapr 1.12 or later is required to use Dapr "Run Files" on Windows (outside of WSL).

### Docker

Local development with Dapr requires a running instance of Docker; follow the [Docker guide](https://www.docker.com/products/docker-desktop) to installing Docker Desktop for your platform.

### Dapr CLI and Runtime

Follow the [Dapr guide](https://dapr.io/#download) to install the Dapr CLI for your platform and initialize the Dapr runtime.

> This extension requires:
> - Dapr CLI version 1.10.0 or later
> - Dapr Runtime version 1.10.0 or later

### Visual Studio Code

Follow the [VS Code guide](https://code.visualstudio.com/) for installing VS Code for your platform.

> This extension requires Visual Studio Code version 1.82.0 or later.

## Feature Overview

### Dapr Run File Support

Dapr 1.10 enables starting multiple Dapr applications through the use of a "run file", and the Dapr extension allows you to start the "run" directly from the File Explorer.

![Start Run From Context Menu](assets/readme/startRunFromContextMenu.png)

The Dapr extension also allows you to start multiple Dapr applications through a single `dapr` task by just referencing the run file.

Sample `tasks.json`:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "dapr",
            "type": "dapr",
            "runFile": "./dapr.yaml"
        }
    ]
}
```

### Run File Editing Assistence

When working with Dapr run files, the extension provides you with basic schema prompts and validation:

![Dapr YAML Editing](assets/readme/daprYamlEditing.png)

### Dapr Application Debugging

Dapr CLI 1.10 now tracks the application started via `dapr run`, which enables the Dapr extension to attach the debugger to running instances, whether started inside or outside of VS Code, directly from the Dapr applications view.

The debugger can be attached to individual applications, or to all applications in a run.

![Attach to Application](assets/readme/attachToApplication.png)

![Attach to Run](assets/readme/attachToRun.png)

The Dapr extension also enables "F5" debugging of Dapr applications through a new custom debug launch configuration, which will automatically start and attach to the applications.  Individual applications can be included or excluded from the set of applications the debugger attaches to.

Sample `launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch Dapr",
            "request": "launch",
            "type": "dapr",
            "runFile": "${workspaceFolder}/dapr.yaml",
            "includeApps": ["csharp-subscriber", "node-subscriber"],
            "preLaunchTask": "dapr"
        }
    ]
}
```

### View Dapr Logs

When using Dapr run files, Dapr redirects the application and Dapr sidecar logs to application-specific locations (rather than writing them to the console). The Dapr extension enables you to open these logs directly from the Dapr applications view.

![View Logs](assets/readme/viewLogs.png)

### Scaffold Dapr task, launch, and component assets

While extensions for Visual Studio Code make it easy to debug applications for a variety of platforms (like .NET Core, Node.js, Python, etc.), coordinating the debugger with the Dapr runtime can be tricky. The Dapr extension helps scaffold VS Code tasks, augments debug launch configurations, and (optionally) generates the Dapr component assets needed to debug your application within the Dapr environment.

![Scaffold Dapr Tasks](assets/readme/scaffoldDaprTasks.png)

### View running Dapr applications

The Dapr extension adds a new tab which shows locally-running Dapr applications and allows quickly invoking application methods or publishing events.

![Dapr Tab](assets/readme/daprTab.png)

### Invoke Dapr application methods

When your application is running, you can quickly invoke its GET/POST methods without using a command line or switching to another HTTP request tool, including specifying an optional payload for POST methods.

![Invoke GET](assets/readme/invokeGet.png)

![Invoke POST](assets/readme/invokePost.png)

### Publish events to Dapr applications

You can also use the extension to directly publish events to running applications, specifying both the topic and an optional payload.

![Publish Message](assets/readme/publishMessage.png)

### Stop Dapr applications

The Dapr extension allows you to directly stop locally-running applications without using the command line.

![Stop Application](assets/readme/stopApp.png)

## Telemetry

### Data Collection

The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft's privacy statement. Our privacy statement is located at https://go.microsoft.com/fwlink/?LinkID=824704. You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.

### Disabling Telemetry

If you don’t wish to send usage data to Microsoft, you can set the `telemetry.enableTelemetry` setting to `false`. Learn more in our [FAQ](https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting).

## Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).

## License

[MIT](LICENSE.txt)
