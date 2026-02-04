#!/bin/bash

# Script to add Breadcrumb integration to EventDetail.tsx

FILE="src/pages/EventDetail.tsx"

# 1. Add imports after line 14 (after getNearestPlace import)
sed -i.bak1 '/import { getNearestPlace } from "@\/utils\/swissPlaces";/a\
import { Breadcrumb } from "@/components/Breadcrumb";\
import { getCategoryLabel, getEventLocation, generateSlug, getCitySlug, getCategorySlug } from "@/utils/eventUtilities";
' "$FILE"

# 2. Find the line with dynamicEvent calculation and add breadcrumb logic after it
# We need to add breadcrumb items calculation around line 715-730 where event data is processed

# For now, let's insert the breadcrumb rendering between Navbar and Hero section (around line 883)
sed -i.bak2 '/^      <Navbar \/>/a\
\
      {/* Breadcrumb Navigation */}\
      {dynamicEvent && (\
        <div className="bg-white border-b border-stone-200">\
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">\
            <Breadcrumb\
              items={[\
                { label: "Events", href: "/eventlist1" },\
                {\
                  label: getEventLocation(dynamicEvent) || "Schweiz",\
                  href: `/events/${getCitySlug(dynamicEvent)}`\
                },\
                ...(getCategoryLabel(dynamicEvent)\
                  ? [{\
                      label: getCategoryLabel(dynamicEvent)!,\
                      href: `/kategorie/${getCategorySlug(dynamicEvent)}`\
                    }]\
                  : []\
                )\
              ]}\
              currentPage={dynamicEvent.title}\
            />\
          </div>\
        </div>\
      )}
' "$FILE"

echo "✅ Breadcrumb integration added to EventDetail.tsx"
echo "Backup saved as EventDetail.tsx.backup"
