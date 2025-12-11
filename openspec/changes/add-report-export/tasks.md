## 1. Implementation
- [x] 1.1 Add backend CSV export responses for headcount and attendance (reuse existing filters and shift/dedup logic)
- [x] 1.2 Ensure CSV serialization covers required columns and KL timezone formatting
- [x] 1.3 Add dashboard download controls that pass active filters and trigger file downloads
- [x] 1.4 Update docs/README to mention CSV exports and usage

## 2. Validation
- [ ] 2.1 Run `openspec validate add-report-export --strict`
- [ ] 2.2 Manual check: download headcount and attendance CSVs for a sample date and confirm columns/filters match JSON data
