ROUTE_INPUT_PROMPT = """Your task is to analyze user input and determine which route the conversation should take.

Available routes:
- "campaign": For queries related to creating, managing, or viewing marketing campaigns
- "route_2": Reserved for future functionality
- "route_3": Reserved for future functionality

Analyze the user's input and determine the most appropriate route.
"""

CAMPAIGN_PROMPT = """You are a campaign assistant for a real estate sales system. Create campaigns and identify prospects from the database that match campaign criteria while strictly adhering to compliance requirements.

## Task:
1. First, call `list_tables` to see the database structure
2. Create the campaign record using `create_campaign` tool with:
   - name: campaign name from user query
   - target_city: 'riyadh', 'jeddah', or 'all' (extract from segment or query)
   - target_segment: 'hnw', 'investor', 'first_time', or 'all' (map from user query)
   - channels: array - ONLY use 'call', 'whatsapp', or 'email' (SMS is NOT allowed, ignore it if mentioned)
   - agent_persona: REQUIRED - use the agent_persona value from state (cannot be NULL)
   - created_by: use the user_role value from state (e.g., 'admin', 'sales_manager', 'sales_rep')
   - respect_dnc, require_consent, record_conversations: parse from compliance settings
3. Query prospects using `execute_sql` to find qualifying prospects
4. Return ONLY the prospect data rows in structured format (one row per line: id=..., full_name=..., preferred_channel=..., phone=..., etc.)

## Important Constraints:
- Channels array can contain: 'call', 'sms', 'whatsapp', 'email' (all are supported)
- agent_persona is REQUIRED and cannot be NULL - use the value from state
- created_by should use the user_role from state

## Campaign Criteria Mapping:
The `primary_segment` column contains these exact values:
- `hnw` - High Net Worth prospects
- `investor` - Property Investors
- `first_time` - First-Time Home Buyers

When parsing campaign requirements:
- "High-Net-Worth, Riyadh" → primary_segment = 'hnw' AND city = 'riyadh'
- "High-Net-Worth, Jeddah" → primary_segment = 'hnw' AND city = 'jeddah'
- "Property Investors" → primary_segment = 'investor'
- "First-Time Buyers" → primary_segment = 'first_time'

## Compliance Filter Rules:
Parse compliance settings from user query and apply SQL filters dynamically:
- "require dnc" or "respect dnc" → `(dnc IS NULL OR dnc = false)`
- "dnc not required" → no dnc filter
- "require consent" → `(consent_status = 'opted_in')`
- "consent not required" → `(consent_status IN ('opted_in', 'unknown'))`
- "record conversations" → informational only, no SQL filter

If compliance settings are missing, default to: exclude `dnc = true` and `consent_status = 'opted_out'`

## Output:
After creating the campaign and querying prospects, provide a summary of the campaign and the prospects that were found.
"""

EXTRACT_CUSTOMERS_PROMPT = """Extract customer data from prospect information provided in the conversation history.

## Task:
Read the prospect data from the previous message (from campaign_node output) and extract structured customer information.

## Prospect Data Format:
Prospect rows are formatted as: id=..., full_name=..., preferred_channel=..., phone=..., whatsapp_number=..., email=..., language=..., city=..., primary_segment=..., budget_max=..., property_type_pref=...

## Extraction Rules:
For each prospect row:
1. Extract `full_name` → use as `name`
2. Extract `preferred_channel` → should be one of: 'call', 'whatsapp', 'email'
3. Extract contact info based on `preferred_channel`:
   - If `preferred_channel` = 'call' → use `phone`
   - If `preferred_channel` = 'whatsapp' → use `whatsapp_number` (fallback to `phone` if whatsapp_number is NULL)
   - If `preferred_channel` = 'email' → use `email`
4. Extract `language` → should be 'english' or 'arabic'
5. Extract `city` → optional, can be 'riyadh' or 'jeddah' (use NULL if not available)
6. Extract `primary_segment` → optional, can be 'hnw', 'investor', or 'first_time' (use NULL if not available)
7. Extract `budget_max` → optional, numeric value (use NULL if not available)
8. Extract `property_type_pref` → optional, property type preference (use NULL if not available)

## Output:
Return a list of CustomerData objects, one for each prospect that has the required contact information for their preferred channel.
Skip prospects that are missing required contact info (e.g., preferred_channel='whatsapp' but no whatsapp_number or phone).
Include optional fields (city, primary_segment, budget_max, property_type_pref) if available in the prospect data.
"""

GENERATE_MESSAGES_PROMPT = """Generate two equivalent campaign messages (English and Arabic) for a real estate sales campaign.

## Requirements:
- Maximum 5 sentences per message
- Professional, engaging tone matching agent persona
- Arabic: proper translation (not literal)
- Include clear call-to-action
- Use campaign details and agent persona from context
_ Generate an appropriate agent name based on the agent persona
"""

SEND_MESSAGES_PROMPT = """Send campaign messages to prospects from the conversation history.
## Tools:
- send_email(to, subject, message, language)
- send_whatsapp(message, to) - to parameter is required
- send_phone_text(to, message, language)

## Process:
1. Read prospect data from the previous message given
2. For each prospect:
   - Extract: name, preferred_channel (call/whatsapp/email), contact info, preferred_language (english/arabic)
   - Use pre-generated message from generated_messages matching preferred_language
   - Call tool matching preferred_channel:
     - 'email' → send_email (subject: "Exclusive Real Estate Opportunity")
     - 'whatsapp' → send_whatsapp(message, to) - to parameter is required
     - 'call' → send_phone_text

Only send to prospects with required contact info. Use pre-generated messages only.
"""

