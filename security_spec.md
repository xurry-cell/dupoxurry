# Security Specification for Dupo Xurry

## 1. Data Invariants
1. **Authentication Requirement**: Every memory document must belong to a verified authenticated user. The `userId` of the memory must be strictly equal to `request.auth.uid`.
2. **Schema Restrictions**: A Memory document must strictly adhere to the `firebase-blueprint.json` schema. Only expected fields are allowed (`title`, `date`, `mediaUrls`, `mediaType`, `userId`, `createdAt`, `musicUrl`, `updatedAt`).
3. **Data Types**: `title`, `date`, `userId`, `mediaType` must be Strings. `mediaUrls` must be a List of Strings. `createdAt` and `updatedAt` must be Timestamps.
4. **Ownership and Query**: The `list` query must strictly evaluate `resource.data.userId == request.auth.uid`.
5. **No Orphan Documents**: There are no relational dependencies other than checking `request.auth.uid`.
6. **Immutable Fields**: `userId` and `createdAt` cannot be modified after the memory is created.
7. **System Path**: `system/{doc}` is allowed to be fetched for connection validations (allow get).

## 2. The "Dirty Dozen" Payloads

1. **Unauthenticated Write**: Creating a memory without being signed in.
2. **Missing Required Fields**: Creating a memory missing `mediaType` or `title`.
3. **Ghost Field Injection**: Creating a memory with an unauthorized `isAdmin: true` field.
4. **Identity Spoofing (Create)**: Authenticated as User A, but creating a memory with `userId: UserB`.
5. **Identity Spoofing (Update)**: Modifying `userId` value of an existing memory to transfer ownership.
6. **Cross-Tenant Access (Read)**: User A attempting to `get` User B's memory directly.
7. **Cross-Tenant Modification (Update)**: User A attempting to modify User B's memory.
8. **Cross-Tenant Deletion**: User A attempting to delete User B's memory.
9. **Query Scraping**: Using an unbound `where` query to steal all memories, bypassing the `userId` restriction.
10. **Type Poisoning**: Sending `mediaUrls` as a string instead of an array.
11. **Size Attack**: Sending a `title` string larger than securely allowed.
12. **Immutable Temporal Field Modification**: Attempting to alter the `createdAt` timestamp during an update.

## 3. The Test Runner: `firestore.rules.test.ts`
(See the actual file for the full Jest test suite logic which verifies the above payloads against the generated rules).
