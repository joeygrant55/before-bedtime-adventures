# Changelog

All notable changes to Before Bedtime Adventures will be documented in this file.

## [1.0.0] - 2025-12-08

### Added
- Initial release of Before Bedtime Adventures
- Photo upload with automatic Disney/Pixar style transformation using Gemini AI
- Multi-page storybook creation and editing
- Real-time image transformation status indicators
- User authentication with Clerk
- Convex backend for real-time data sync and file storage

### Fixed
- **HEIC Image Support**: Implemented robust multi-strategy HEIC to JPEG conversion for iPhone photos
  - Strategy 1: heic2any library (Chrome/Firefox)
  - Strategy 2: Canvas API with createImageBitmap (Safari native HEIC support)
  - Strategy 3: FileReader + Image fallback
  - Graceful fallback to upload original if all conversions fail
- **SSR Compatibility**: Fixed `window is not defined` error by using dynamic imports for browser-only libraries
- **Gemini API Response Parsing**: Fixed camelCase vs snake_case mismatch in image transformation response handling (`inlineData` vs `inline_data`)
- **File Validation**: Updated to accept HEIC files even when MIME type is not correctly reported by iOS

### Technical Details
- Next.js 16.0.7 with Turbopack
- Convex for backend and file storage
- Gemini 3 Pro Image API for AI transformations
- heic2any library for client-side HEIC conversion
