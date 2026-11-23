## Git Push Constraints and Configuration
- **DO NOT** perform a `git push` without explicit instruction from the user.
- **WHEN INSTRUCTED TO PUSH**, you must first configure the local git repository with `git config user.name "ahmadrahman79"` and `git config user.email "digitalofficer79@gmail.com"` before executing the push.
- **NEVER COMMIT OR PUSH** any confidential files including:
  - `data/` folder and any `.xlsx` / `.docx` files (e.g. `data/data mitra se2026.xlsx`, `data/Template Laporan Pendataan PPL.docx`)
  - Implementation Plan documents (`*Implementation Plan*`, `*implementation_plan*`, `*.plan.md`)

## Mandatory Pre-Push Security Pentesting & Quality Gate (`claude-pentest-skills`)
- **SETIAP AKAN MELAKUKAN GIT PUSH**: Anda DIWAJIBKAN menjalankan pengujian keamanan menyeluruh (*penetration testing*) mengacu pada metodologi `.agents/skills/claude-pentest` (OWASP WSTG, Injection, IDOR, Broken Access Control, Secret Leakage, PII Protection, Client-Side DLP).
- **JIKA DITEMUKAN CELAH KEAMANAN (VULNERABILITY)**:
  1. **MUTLAK DILARANG MELAKUKAN GIT PUSH KE GITHUB**.
  2. Laporkan secara rinci temuan celah keamanan tersebut kepada pengguna (tingkat keparahan, file/endpoint terdampak, bukti temuan, dan rekomendasi perbaikan).
  3. **TUNGGU PERINTAH RESMI**: Jangan melakukan push ke GitHub sampai ada perintah eksplisit push ke GitHub berikutnya dari pengguna setelah celah diperbaiki.
- **HANYA LAKUKAN PUSH** jika pentesting telah tervalidasi 100% aman (0 Vulnerabilities, 0 High/Critical Findings) dan pengguna telah memberikan instruksi lanjut.

## Mandatory Commit Sync ke Database SQL (`system_github_commits`)
- **SETIAP ADA COMMIT BARU / AKAN PUSH**: Jalankan `node scripts/sync_github_commits_to_sql.cjs` untuk menyalin log commit ke tabel SQL `system_github_commits` dan file `public/data/latest_updates.json` agar pembaruan fitur terkini di halaman login selalu tersinkronisasi presisi 100% dengan tetap menjaga keamanan data.
