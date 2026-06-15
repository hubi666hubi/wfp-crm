# Security Spec

1. Data Invariants:
- A user document must match the authenticated uid.
- A VSL script must have an ownerId matching the authenticated uid.
- Timestamps must be validated against `request.time`.

2. The "Dirty Dozen" Payloads:
- Shadow Update: Adding `isAdmin: true` to a VslScript.
- Value Poisoning: Setting `topic` to an integer in VslScript.
- Identity Spoofing: Setting `ownerId` to someone else's UID.
