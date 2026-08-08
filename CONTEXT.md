# Tax Platform (Preparer Review)

The CPA-facing side of an AI-powered tax platform: a preparer opens a client's return, reviews each AI-extracted value against its source document, and works down a prioritized list of what needs attention. This context covers only the preparer/CPA experience — the client-facing side is deliberately out of scope.

## Language

**Return**:
A tax return prepared for one Client for one tax year.
_Avoid_: filing, form, submission

**Client**:
The taxpayer — an individual or business — whose Return is being prepared.
_Avoid_: customer, user, account

**Preparer**:
The CPA-firm staff member who owns and works a Return. The only role this product serves.
_Avoid_: accountant, agent, reviewer, user

**Source Document**:
An uploaded document (W-2, 1099-INT, …) that serves as the evidence behind values on a Return.
_Avoid_: file, upload, attachment

**Field**:
A single value on a Return, tied to the Source Document it was extracted from.
_Avoid_: cell, entry, line item

**Provenance**:
The traceable chain from a Field back to its Source Document, the exact page/region, and any calculation applied.
_Avoid_: source, origin, lineage

**Confidence**:
The AI's certainty in an extracted Field, expressed in bands — High, Medium, Low.
_Avoid_: score, accuracy, probability

**Field State**:
A Field's interaction status: `ai-suggested`, `verified`, `locked`, `editable`, or `needs-approval`. Determines what a Preparer can do to it.
_Avoid_: status, mode, type

**Stage**:
Where a Return sits in its lifecycle (e.g. intake → in review → ready to file).
_Avoid_: status, state, phase

**Open Item**:
An outstanding action on a Return, with a clear owner and urgency.
_Avoid_: task, todo, ticket, issue

**Review Queue**:
The set of low-Confidence Fields a Preparer needs to verify so nothing slips through.
_Avoid_: inbox, worklist
