# Changelog

## 1.0.0 (2026-09-19)


### Features

* **auth:** add email and password sign-in with password reset ([5ea739b](https://github.com/zekkv/tanstack-start-template/commit/5ea739b38a6dc0873b4fc92409715ddcab90ed56))
* **features:** implement auth, notes, email services, and application routes ([01cb466](https://github.com/zekkv/tanstack-start-template/commit/01cb46695fffc9eb4abd0fd17fd4ed4782a2c253))
* **infra:** add docker sidecars, ci workflow, database schemas, and core utilities ([afd41cc](https://github.com/zekkv/tanstack-start-template/commit/afd41cc8f4f97efc371842cea51de4717c6adb81))
* **seo:** implement SEO, crawlability, and build optimizations ([44e6b3b](https://github.com/zekkv/tanstack-start-template/commit/44e6b3b796fd9711274a239716441a7574432449))
* **ui:** add shadcn UI component library, layout, and global styling ([14437e0](https://github.com/zekkv/tanstack-start-template/commit/14437e01bee925ab2ef016ced127badf0feacb9f))
* **ui:** redesign template as monochrome typeset README ([fc1157d](https://github.com/zekkv/tanstack-start-template/commit/fc1157da3a2f81a21287b2f0ea9057214c1382ee))


### Bug Fixes

* **ci:** resolve workflow failures and switch to native vitest reporter ([8f819fe](https://github.com/zekkv/tanstack-start-template/commit/8f819fe729aa0f2d904c01ad742af4c6716e6679))
* **logging:** sanitize request url to prevent secret and token leakage ([32f1d50](https://github.com/zekkv/tanstack-start-template/commit/32f1d5039f4f469a0ce69b2a7e1d1ad0bbe5455a))
* **notes:** prevent bun runtime imports from leaking into client bundle ([b505e44](https://github.com/zekkv/tanstack-start-template/commit/b505e44aa307ffeee6d3fea0e5df3c4e94388865))
* **query:** align TanStack Query usage with upstream best practices ([674bc2e](https://github.com/zekkv/tanstack-start-template/commit/674bc2ea427bb9deef87668bb7db1d73f833e6a6))
* **security:** upgrade deps to latest versions to resolve `bun audit` ([5956aa8](https://github.com/zekkv/tanstack-start-template/commit/5956aa8aaf7ad456abcbc4407a6933814ebcc08a))


### Performance Improvements

* **bundle:** lazy-load Sentry replay and dev-gate devtools ([3e60118](https://github.com/zekkv/tanstack-start-template/commit/3e60118b0d619a296b50e019f721e039e03ad53f))
* **docker:** trace Sentry at build and drop the node_modules copy ([47cd11f](https://github.com/zekkv/tanstack-start-template/commit/47cd11f41b3766820a30c4f5ffe96650db4e8a8d))
