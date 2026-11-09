---
'zerion-wallet': minor
---

Beta channel: every push to `main` builds the same extension bundle with the coral beta artwork, its own Firefox add-on id and a fourth manifest version part, and uploads it to the separate Chrome Web Store and AMO beta listings. Production releases upload to the production listings from the tag build. Both uploads are skipped when the store item ids are not configured.
