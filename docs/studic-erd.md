# Studic — Logical Entity Relationship Diagram

> **Status:** Proposed logical database design for the MCA project synopsis.  
> This diagram combines the current Studic data model with agreed future requirements. It is not a claim that every proposed entity is already implemented in MongoDB.

## Design decisions

- Roles: `student` and `admin`; Owner is an admin-level account with additional permissions. Seller is excluded from the target design.
- Blog body is Markdown stored in `BLOG.content`. YouTube embeds, images, code blocks, links and formatting remain inside this field; there is no separate Video entity.
- Students submit blog edits as contributions. Admins review and approve/reject them; students do not directly overwrite published content.
- Chat supports direct and group conversations. The current implementation stores participants/admins as arrays in Chat, not a separate ConversationMember collection.
- Product, Course and Blog purchases are represented through OrderItem in the proposed normalized design. The current repository Order model instead has direct optional references to Product/Course/Blog; migration is required before adopting OrderItem.
- Contribution and OrderItem are proposed entities. The other entities below are based on models found in the repository.
- Chat attachments remain embedded in Message. ChatSettings controls global media/document/voice-call settings.
- Analytics records are retained according to the one-year retention policy at the application/job level.

## ER diagram

```mermaid
erDiagram
    direction TB

    USER {
        ObjectId _id PK
        string username UK
        string name
        string email UK
        string password
        string about
        string phone
        string image
        string role
        string status
        boolean isOwner
        datetime emailVerified
        datetime lastLoginAt
        datetime createdOn
        datetime updatedAt
    }

    COURSE {
        ObjectId _id PK
        string slug UK
        string title
        string status
        string accessType
        decimal price
        string currency
        string description
        string thumbnail
        ObjectId author FK
        string level
        string language
        int estimatedMinutes
        string prerequisites
        datetime publishedAt
        datetime createdOn
        datetime updatedAt
    }

    BLOG {
        ObjectId _id PK
        string slug UK
        string title
        string status
        string accessType
        decimal price
        string currency
        string description
        string thumbnail
        text content
        string category
        string tags
        ObjectId author FK
        ObjectId course FK
        int estimatedMinutes
        string seoTitle
        string seoDescription
        datetime publishedAt
        datetime createdOn
        datetime updatedAt
    }

    PRODUCT {
        ObjectId _id PK
        string slug UK
        string title
        decimal price
        string currency
        string description
        string thumbnail
        string filePublicId
        string fileLink
        string fileName
        int fileSize
        string mimeType
        int downloadLimit
        string tags
        string status
        datetime publishedAt
        datetime createdOn
        datetime updatedAt
    }

    ENROLLMENT {
        ObjectId _id PK
        ObjectId user FK
        ObjectId course FK
        ObjectId order FK
        string status
        datetime enrolledAt
        datetime completedAt
        decimal progressPercent
        datetime lastAccessedAt
    }

    ORDER {
        ObjectId _id PK
        string orderId UK
        string transactionId
        ObjectId buyer FK
        decimal amount
        string currency
        string status
        string paymentProvider
        string providerOrderId
        string providerPaymentId
        string failureReason
        datetime paidAt
        datetime refundedAt
        datetime createdOn
        datetime updatedAt
    }

    ORDER_ITEM {
        ObjectId _id PK
        ObjectId order FK
        ObjectId product FK
        ObjectId course FK
        ObjectId blog FK
        string itemType
        decimal unitPrice
        int quantity
    }

    REVIEW {
        ObjectId _id PK
        ObjectId user FK
        ObjectId product FK
        ObjectId course FK
        int rating
        string comment
        string status
        string sellerReply
        datetime repliedAt
        datetime createdOn
        datetime updatedAt
    }

    CONTRIBUTION {
        ObjectId _id PK
        ObjectId blog FK
        ObjectId submittedBy FK
        string proposedTitle
        string proposedDescription
        text proposedContent
        string status
        ObjectId reviewedBy FK
        string reviewComment
        datetime submittedAt
        datetime reviewedAt
    }

    COMMENT {
        ObjectId _id PK
        ObjectId blog FK
        ObjectId user FK
        ObjectId parentComment FK
        string message
        string status
        datetime createdOn
        datetime updatedAt
    }

    CHAT {
        ObjectId _id PK
        string kind
        string name
        string description
        string image
        string participants
        string admins
        ObjectId createdBy FK
        string systemKey
        int slowModeSeconds
        string restrictedWords
        datetime messageSendAfter
        int messageRetentionSeconds
        string permissions
        string mutedUsers
        string lastMessage
        datetime lastMessageAt
        datetime createdOn
        datetime updatedAt
    }

    MESSAGE {
        ObjectId _id PK
        ObjectId chat FK
        ObjectId sender FK
        string text
        string attachment
        datetime expiresAt
        datetime createdOn
        datetime updatedAt
    }

    CHAT_READ {
        ObjectId _id PK
        ObjectId chat FK
        ObjectId user FK
        datetime lastReadAt
        datetime createdAt
        datetime updatedAt
    }

    VOICE_CALL {
        ObjectId _id PK
        ObjectId chat FK
        string participants
        string signals
        datetime createdAt
        datetime updatedAt
    }

    CHAT_SETTINGS {
        ObjectId _id PK
        string key UK
        boolean allowMedia
        boolean allowImages
        boolean allowDocuments
        boolean allowVoiceCalls
        int retentionDays
        ObjectId updatedBy FK
        datetime createdAt
        datetime updatedAt
    }

    QUERY {
        ObjectId _id PK
        string name
        string description
        string email
        ObjectId user FK
        string status
        string priority
        ObjectId assignedTo FK
        string adminNotes
        datetime resolvedAt
        datetime createdOn
        datetime updatedAt
    }

    ANALYTICS {
        ObjectId _id PK
        ObjectId userId FK
        datetime periodStart
        datetime periodEnd
        decimal totalRevenue
        decimal totalPaidAmount
        int productsSold
        int coursesSold
        int ordersCount
        datetime lastUpdated
    }

    USER ||--o{ COURSE : authors
    USER ||--o{ BLOG : authors
    COURSE ||--o{ BLOG : contains
    COURSE }o--o{ PRODUCT : linked_to
    BLOG }o--o{ PRODUCT : linked_to

    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT o|--o{ ORDER_ITEM : purchased_as
    COURSE o|--o{ ORDER_ITEM : purchased_as
    BLOG o|--o{ ORDER_ITEM : purchased_as

    USER ||--o{ ENROLLMENT : enrolls
    COURSE ||--o{ ENROLLMENT : has
    ORDER o|--o{ ENROLLMENT : enables

    USER ||--o{ REVIEW : writes
    PRODUCT o|--o{ REVIEW : receives
    COURSE o|--o{ REVIEW : receives

    USER ||--o{ CONTRIBUTION : submits
    BLOG ||--o{ CONTRIBUTION : receives
    USER o|--o{ CONTRIBUTION : reviews

    USER ||--o{ COMMENT : writes
    BLOG ||--o{ COMMENT : contains
    COMMENT o|--o{ COMMENT : replies_to

    USER ||--o{ CHAT : creates
    USER }o--o{ CHAT : participates_in
    USER }o--o{ CHAT : administers
    CHAT ||--o{ MESSAGE : contains
    USER ||--o{ MESSAGE : sends
    CHAT ||--o{ CHAT_READ : tracks
    USER ||--o{ CHAT_READ : reads
    CHAT ||--o| VOICE_CALL : hosts
    USER o|--o{ CHAT_SETTINGS : updates

    USER o|--o{ QUERY : raises
    USER o|--o{ QUERY : assigned_to
    USER ||--o{ ANALYTICS : owns_records
```

## Implementation notes before schema migration

1. Add `isOwner` or an equivalent explicit permission mechanism to User; enforce owner-only admin creation/removal in authorization logic.
2. Add a Contribution model with immutable submission history and reviewer metadata.
3. Decide whether to migrate Order to OrderItem. If adopted, enforce that exactly one of product/course/blog is set per item.
4. Remove Seller role and seller references only after checking and migrating existing user/product/order data and all server functions that read them.
5. Keep Chat participants/admins as arrays unless a deliberate migration to a separate membership collection is planned.
6. Preserve the existing Comment, Analytics, ChatRead, VoiceCall, ChatSettings and Query models/relationships.
7. Reviews must reference exactly one of Product or Course, matching the existing model validation.
