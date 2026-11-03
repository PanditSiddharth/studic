# Studic — Logical Entity Relationship Diagram

> **Status:** Final proposed logical database design for the MCA project synopsis.  
> This is the target design based on the agreed Studic requirements. Existing GitHub models may differ until the planned migrations and implementation work are completed.

## Final design decisions

- **Roles:** only `student` and `admin`. Owner is an admin account with the additional `isOwner` permission. Only Owner can add or remove Admin accounts.
- **Seller:** removed from the target design. Product has no seller reference; seller-specific user and order fields are excluded.
- **Blog content:** `BLOG.content` remains a Markdown text field. Text, headings, images, YouTube embeds, code blocks, links and formatting all live in this field. No separate Video entity is needed.
- **Blog contributions:** students submit proposed blog edits through `CONTRIBUTION`. Admin reviews and approves/rejects the submission. Students do not directly overwrite published blogs.
- **Orders:** the target design uses `ORDER_ITEM` so one order can contain one or more purchasable items. Each order item must reference exactly one of Product, Course or Blog.
- **Chat membership:** no separate `CONVERSATION_MEMBER` entity. Direct/group chat membership and chat admins are represented by participant/admin references associated with `CHAT`.
- **Attachments:** attachment metadata remains embedded in `MESSAGE`; no separate Attachment entity.
- **Voice calls:** excluded from this ERD. The previous VoiceCall model was only used for testing and is not part of the planned Studic system.
- **Reviews:** a review targets exactly one Product or Course.
- **Analytics:** one-year data retention is an application-level scheduled cleanup policy.

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
        boolean isOwner
        ObjectId adminCreatedBy FK
        string status
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

    CHAT_SETTINGS {
        ObjectId _id PK
        string key UK
        boolean allowMedia
        boolean allowImages
        boolean allowDocuments
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

    %% OWNER AND ADMIN MANAGEMENT
    USER o|--o{ USER : creates_admin_accounts

    %% CONTENT CREATION AND ORGANIZATION
    USER ||--o{ COURSE : authors
    USER ||--o{ BLOG : authors
    COURSE ||--o{ BLOG : contains

    %% PRODUCT ASSOCIATIONS
    COURSE }o--o{ PRODUCT : linked_to
    BLOG }o--o{ PRODUCT : linked_to

    %% PURCHASES
    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT o|--o{ ORDER_ITEM : purchased_as
    COURSE o|--o{ ORDER_ITEM : purchased_as
    BLOG o|--o{ ORDER_ITEM : purchased_as

    %% ENROLLMENTS
    USER ||--o{ ENROLLMENT : enrolls
    COURSE ||--o{ ENROLLMENT : has
    ORDER o|--o{ ENROLLMENT : enables

    %% REVIEWS
    USER ||--o{ REVIEW : writes
    PRODUCT o|--o{ REVIEW : receives
    COURSE o|--o{ REVIEW : receives

    %% BLOG CONTRIBUTIONS
    USER ||--o{ CONTRIBUTION : submits
    BLOG ||--o{ CONTRIBUTION : receives
    USER o|--o{ CONTRIBUTION : reviews

    %% BLOG COMMENTS
    USER ||--o{ COMMENT : writes
    BLOG ||--o{ COMMENT : contains
    COMMENT o|--o{ COMMENT : replies_to

    %% DIRECT AND GROUP CHAT
    USER ||--o{ CHAT : creates
    USER }o--o{ CHAT : participates_in
    USER }o--o{ CHAT : administers
    CHAT ||--o{ MESSAGE : contains
    USER ||--o{ MESSAGE : sends
    CHAT ||--o{ CHAT_READ : tracks
    USER ||--o{ CHAT_READ : reads
    USER o|--o{ CHAT_SETTINGS : updates

    %% SUPPORT
    USER o|--o{ QUERY : raises
    USER o|--o{ QUERY : assigned_to

    %% ANALYTICS
    USER ||--o{ ANALYTICS : owns_records
```

## Current repository versus final proposed design

| Area | Current GitHub implementation | Final proposed design |
|---|---|---|
| User roles | `student`, `seller`, `admin` | `student`, `admin`; Owner permission via `isOwner` |
| Product seller reference | Product has `seller` | Remove seller reference |
| Order seller reference | Order has legacy `seller` field | Remove seller reference |
| Blog edit workflow | No dedicated contribution model found | Add `CONTRIBUTION` |
| Order items | Order directly references optional Product/Course/Blog | Add normalized `ORDER_ITEM` |
| Owner permission | No dedicated owner flag found | Add `isOwner`; owner-only admin management |
| Chat membership | Chat stores participants/admins arrays | Keep Chat-based membership; no separate ConversationMember |
| YouTube videos | No separate Video model | Keep embeds in Markdown `BLOG.content` |
| Voice calls | VoiceCall model exists for testing | Exclude from planned system |
| Comments | BlogData Comment model | Keep Comment |
| Analytics | Analytics model exists | Keep Analytics; retain one year |
| Chat settings | ChatSettings model exists | Keep media/document controls; no voice-call setting |

## Migration and implementation notes

1. Update User role validation to allow only `student` and `admin`; add `isOwner` and enforce owner-only admin creation/removal on the server.
2. Migrate or remove existing seller accounts and Product/Order seller references safely before deleting those fields from schemas and application code.
3. Add a Contribution model with immutable submission history, proposed Markdown content, status, reviewer and review timestamps.
4. Add OrderItem and migrate existing Order product/course/blog references. Enforce that exactly one target reference is set for each item.
5. Keep Chat participants/admins in the Chat model; do not add a ConversationMember collection.
6. Keep YouTube embeds and all other rich content in Markdown `BLOG.content`; do not create a Video collection.
7. Exclude VoiceCall and voice-call settings from the target product; remove the test-only model and related routes/UI when cleaning up implementation.
8. Keep Comment, Analytics, ChatRead, ChatSettings and Query as application entities.
9. Enforce that each Review references exactly one of Product or Course.
10. Enforce one-year analytics retention through a scheduled cleanup process.
