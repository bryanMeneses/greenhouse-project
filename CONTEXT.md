# Tax Platform (Preparer Review)

An AI-powered tax platform for both the CPA firm and its clients: a preparer opens a client's return, reviews each AI-extracted value against its source document, and works down a prioritized list of what needs attention, while clients see a role-appropriate view of the same return. The platform is role-aware (see ADR-0004); the Preparer/CPA experience is the most built-out today, with client-facing surfaces growing per challenge.

## Language

**Return**:
A tax return prepared for one Client for one tax year.
_Avoid_: filing, form, submission

**Client**:
The taxpayer — an individual or business — whose Return is being prepared.
_Avoid_: customer, user, account

**Preparer**:
The CPA-firm staff member who owns and works a Return. The most built-out Role, but no longer the only one — the platform is role-aware (ADR-0004). One of the four Firm-family Roles.
_Avoid_: accountant, agent, user

**User**:
A person with an identity in the platform — the _who_. A User holds one or more Roles; the shell renders against their active Role, never the User directly. This is what lets one firm employee also be the Client on their own Return.
_Avoid_: account, login, actor

**Role**:
What a User acts as, determining what they see and can do — the _who, as what_. Six exist across two families — **Firm** (Preparer, Reviewer, Firm Admin, Seasonal Staff) and **Client** (Individual Taxpayer, Business Owner). A Client Role is a flavor of Client; a Firm Role, a flavor of firm staff.
_Avoid_: hat, persona, permission, group, type

**Role family**:
Which side of the firm a Role sits on — the _which side_: **Firm** (staff) or **Client** (taxpayer). Every Role belongs to exactly one, so a User's active Role already tells you their side.
_Avoid_: side, team, group

**Active Role**:
The Role a User is currently acting as — the one thing the shell adapts to. Because every Role has a Role family, the active Role also says which side of the firm the User is on. A multi-role User switches their active Role to change context (e.g. from their Firm Role to the Client Role on their personal Return). One User, many Roles, one active at a time.
_Avoid_: persona, hat, mode, profile, session

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
