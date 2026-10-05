# Publishing checklist

## Major requirement: bundle optimization with full offline support

User explicitly requested that this be completed before publishing (October 4, 2026).

- Split application code and resource data so the initial page does not load the entire resource database.
- Implement offline caching for all required pages, data, and image assets, including separately loaded bundles.
- Ensure caching completes during online setup; opening each individual resource page must not be required for offline availability.
- Verify the production build in airplane mode, including pages that have never been opened, navigation, and saved user data.
- Verify cache updates when a new app version is published.

Schedule this after resource development settles and before publication. Preserve current appearance and functionality.
