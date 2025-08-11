# Playwright JUnit Reporting Extension

This library's purpose is to provide extensions to the playwright junit reporting integration by adding tags and annotations from test cases into the junit properties.

This library's integration is not specific to any test reporting tool (like the available xray plugin) and should abstractly just report tag and annotation data structures into the junit property.

Various tools may then process the junit content.

The intent for this library is to be customizable via playwright configuration. Native playwright reporting mechanisms will be used.

## Versioning

Semantic versioning will be used. Repository tags and GitHub release(s) will be provided.

## Releases

Releases will be done ad-hoc, automated and executed by CI, and will be triggered by repository tagging.

## Contributing

[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit)](https://github.com/pre-commit/pre-commit)
