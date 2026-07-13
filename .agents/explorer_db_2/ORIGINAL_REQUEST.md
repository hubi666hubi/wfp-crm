## 2026-07-08T20:04:27Z
You are explorer_db_2. Your working directory is c:\Users\brend\Desktop\XX2\.agents\explorer_db_2\.
Please explore the CRM application's existing codebase to identify references/fields for:
- Leads (Lead)
- System events, specifically ZAPALNIK_CLIP (Event)
- Marketing campaigns (Campaign)
- Code evolution logs (EvolutionLog)

Using the Firebase SQL Connect skill reference located at c:\Users\brend\Desktop\XX2\.agents\skills\firebase_data_connect_basics\SKILL.md (and the files in the reference/ folder), design the PostgreSQL database schema and queries/mutations using Native GraphQL:
1. Define the GQL schema in `schema/schema.gql` using appropriate directives (@table, @col, @default, @ref, @unique, @index).
2. Configure `dataconnect.yaml` and `connector/connector.yaml` (SDK output directed to `server/dataconnect/`).
3. Define queries with filtering/sorting in `connector/queries.gql`.
4. Define mutations (including _upsert operations) in `connector/mutations.gql`.

Write your analysis and proposed files to c:\Users\brend\Desktop\XX2\.agents\explorer_db_2\handoff.md and notify me when you are done.
