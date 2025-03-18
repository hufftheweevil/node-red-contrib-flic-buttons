# Changelog

## [2.0.0] - 2025-03-18

A major revamp was done to ensure the connection to the flic server is more reliable and robust. To do this,
a flic server config node was added, which points to the flicd server. This must be set as a property for each
flic node.

### Breaking Changes

- Added a required server property for flic node, which points to a config node for the flic server

### Fixed

- Removed use of deprecated `Buffer()` constructor

## [1.1.1] - 2020-10-31

### Fixed

- Date format in node status

## [1.1.0] - 2020-10-31

### Added

- Status shows last event received

## [1.0.0] - 2020-07-14

### Added

- More documenation regarding click types
- Feature to allow multiple click types (aka events) per node
- Optional debug property

### Changed

- Event dropdown to multiple checkboxes (requires manual editting of the node on upgrade)

## [0.1.3] by [osos](https://github.com/osos/node-red-contrib-flic-buttons) - 2019-03-13

### Added

- Auto-disconnect time parameter (save battery life)

## [0.1.3] by [hardilib](https://github.com/osos/node-red-contrib-flic-buttons)

- The original repo
