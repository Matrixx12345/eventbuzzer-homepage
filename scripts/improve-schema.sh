#!/bin/bash

# Script to improve Schema.org in EventDetail.tsx

FILE="src/pages/EventDetail.tsx"

# 1. Replace simple image string with ImageObject array
sed -i.schema1 's/"image": event\.image,/"image": [\
        {\
          "@type": "ImageObject",\
          "url": event.image,\
          "width": 1200,\
          "height": 630\
        }\
      ],/' "$FILE"

# 2. Add geo coordinates to location (insert after address closing brace)
sed -i.schema2 '/addressCountry": "CH"/a\
        },\
        ...(dynamicEvent?.latitude \&\& dynamicEvent?.longitude ? {\
          "geo": {\
            "@type": "GeoCoordinates",\
            "latitude": dynamicEvent.latitude,\
            "longitude": dynamicEvent.longitude\
          }\
        } : {})
' "$FILE"

# 3. Add aggregate rating block (insert before "Add price if available" comment)
sed -i.schema3 '/\/\/ Add price if available/i\
\
    \/\/ Add aggregate rating based on buzz_score\
    if (dynamicEvent?.buzz_score \&\& dynamicEvent.buzz_score > 0) {\
      const ratingValue = Math.min(5, Math.max(1, (dynamicEvent.buzz_score \/ 20)));\
      schema["aggregateRating"] = {\
        "@type": "AggregateRating",\
        "ratingValue": ratingValue.toFixed(1),\
        "bestRating": "5",\
        "worstRating": "1",\
        "ratingCount": Math.max(10, Math.floor(dynamicEvent.buzz_score \/ 2))\
      };\
    }\

' "$FILE"

# 4. Add validFrom to offers
sed -i.schema4 's/"availability": "https:\/\/schema\.org\/InStock"/"availability": "https:\/\/schema.org\/InStock",\
        "validFrom": dynamicEvent?.start_date || new Date().toISOString()/' "$FILE"

echo "✅ Schema.org improvements applied to EventDetail.tsx"
