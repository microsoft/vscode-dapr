# Change Log

## v0.3.0 - 02 September 2020

A collection of accumulated fixes and minor enhancements.

### Fixed

* Pop up an error "Request failed with status code 404" when publishing message [#117](https://github.com/microsoft/vscode-dapr/issues/117)
* The default value of the port is "app" when invoking "Dapr: Scaffold Dapr Tasks" command [#109](https://github.com/microsoft/vscode-dapr/issues/109)
* It shows "Failed to load message bundle..." after expanding "APPLICATIONS" [#104](https://github.com/microsoft/vscode-dapr/issues/104)
* daprd no longer defaults to a components path [#98](https://github.com/microsoft/vscode-dapr/issues/98)
* daprd task problem matcher does not support non-web apps [#89](https://github.com/microsoft/vscode-dapr/issues/89)
* dapr scaffold dapr tasks not working in workspace view [#88](https://github.com/microsoft/vscode-dapr/issues/88)
* Use DAPR_PLACEMENT_HOST for default placement address [#85](https://github.com/microsoft/vscode-dapr/issues/85)
* Use DAPR_REDIS_HOST for scaffolding instead of DAPR_NETWORK [#84](https://github.com/microsoft/vscode-dapr/issues/84)
* error establishing client to placement service [#82](https://github.com/microsoft/vscode-dapr/issues/82)
* Dapr runtime not detected in Dev Container [#80](https://github.com/microsoft/vscode-dapr/issues/80)

### Added

* There is no validation in the JSON payload input box [#112](https://github.com/microsoft/vscode-dapr/issues/112)

## v0.2.1 - 19 March 2020

Minor fixes.

### Fixed

* "Localized" extension description isn't resolved in Marketplace. [#77](https://github.com/microsoft/vscode-dapr/issues/77)

## v0.2.0 - 18 March 2020

Further updates related to the Dapr 0.5.0 release.

### Added

* Bundle extension assets for size/performance. [#16](https://github.com/microsoft/vscode-dapr/issues/16)
* Expose publish command at tree view level. [#26](https://github.com/microsoft/vscode-dapr/issues/26)
* Manage conflicts during scaffolding. [#33](https://github.com/microsoft/vscode-dapr/issues/33)
* Detect when Dapr is not installed or initialized. [#46](https://github.com/microsoft/vscode-dapr/issues/46)

### Updated

* Add smarter default for Python ports. [#54](https://github.com/microsoft/vscode-dapr/issues/54)
* Add smarter defaults for Java ports. [#55](https://github.com/microsoft/vscode-dapr/issues/55)
* Add support for new `daprd` 0.5.0 arguments. [#69](https://github.com/microsoft/vscode-dapr/issues/69)

### Fixed

* Make Dapr invocation work with .NET Core ASP.NET using SSL. [#44](https://github.com/microsoft/vscode-dapr/issues/44)

## v0.1.1 - 12 March 2020

Minor update for the Dapr 0.5.0 release.

### Updated

* Accommodate Dapr 0.5.0 breaking changes. [#65](https://github.com/microsoft/vscode-dapr/issues/65)

## v0.1.0 - 27 February 2020

Initial public release.

### Added

* Help and feedback tree view. [#25](https://github.com/microsoft/vscode-dapr/issues/25)

### Updated

* Switch to "wizard" flow for command prompts. [#34](https://github.com/microsoft/vscode-dapr/pull/34)

## v0.0.2-alpha - 21 February 2020

Release for internal product review.

### Added

* Dapr tab with application tree view.
* Commands to invoke application (GET/POST) methods and publishing events.

## v0.0.1-alpha - 16 January 2020

Prototype release.

### Added

* Scaffolding Dapr tasks and debug launch configurations.