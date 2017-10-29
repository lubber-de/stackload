# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [1.0.6]
### Changed
- License from GPLv3 to MIT

### Added
- new option `noCache` for fileObjects to prevent caching if needed for non-jsonp files
- Changelog

## [1.0.5] - 2017-10-20
### Added
- Internal Helper "cssProperties()" to check for specific CSS properties for the "check" property of fileObjects

### Changed
- Readme updated

### Fixed
- loading was completely discontinued when a check expression was true
- Small fixes

## [1.0.4] - 2017-10-17
### Added
- Look for @import urls in stylesheets

## [1.0.3] - 2017-10-17
### Added
- Fill up registry with already embedded resources to avoid reloading

### Fixed
- Element deletion failed when jsonp resource is not available

## [1.0.2] - 2017-10-16
### Fixed
- Launch the success callback even when all scripts are already loaded

## [1.0.1] - 2017-10-16
### Added
- JsonP Support. Use type 'jsonp' in fileObject. Probably needed callback function parameter must already be part of the given url

## 1.0.0 - 2017-10-13
### Added
- Initial Commit

[Unreleased]: /../compare/v1.0.6...HEAD  
[1.0.6]: /../compare/v1.0.5...v1.0.6
[1.0.5]: /../compare/v1.0.4...v1.0.5
[1.0.4]: /../compare/v1.0.3...v1.0.4
[1.0.3]: /../compare/v1.0.2...v1.0.3
[1.0.2]: /../compare/v1.0.1...v1.0.2
[1.0.1]: /../compare/v1.0.0...v1.0.1
