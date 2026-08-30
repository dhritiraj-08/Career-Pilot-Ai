"use client";

import * as React from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { OverviewValues } from "@/lib/validations/profile";
import type { JobPreferencesValues, SocialLinksValues } from "@/lib/validations/onboarding";
import { ProfileSidebar } from "./profile-sidebar";
import { OverviewTab } from "./overview-tab";
import { SkillsTab, type SkillRow } from "./skills-tab";
import { EducationTab, type EducationRow } from "./education-tab";
import { CertificationsTab, type CertificationRow } from "./certifications-tab";
import { PreferencesTab } from "./preferences-tab";
import { LinksTab } from "./links-tab";

export interface ProfilePageData {
  userId: string;
  avatarUrl: string | null;
  overview: OverviewValues;
  skills: SkillRow[];
  education: EducationRow[];
  certifications: CertificationRow[];
  jobPreferences: JobPreferencesValues;
  socialLinks: SocialLinksValues;
}

function computeCompletion(data: ProfilePageData) {
  const checks = [
    !!data.avatarUrl,
    !!(data.overview.full_name && data.overview.phone && data.overview.city),
    !!(data.overview.current_job_role || data.overview.current_company || data.overview.years_experience > 0),
    data.skills.length > 0,
    data.education.length > 0,
    data.jobPreferences.target_roles.length > 0,
    !!(data.socialLinks.linkedin_url || data.socialLinks.github_url || data.socialLinks.portfolio_url),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function ProfilePageClient({ initial }: { initial: ProfilePageData }) {
  const [data, setData] = React.useState(initial);
  const completion = computeCompletion(data);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <ProfileSidebar
        userId={data.userId}
        fullName={data.overview.full_name}
        avatarUrl={data.avatarUrl}
        currentJobRole={data.overview.current_job_role || null}
        currentCompany={data.overview.current_company || null}
        city={data.overview.city}
        completionPercent={completion}
        skillsCount={data.skills.length}
        certificationsCount={data.certifications.length}
        onAvatarUploaded={(url) => setData((d) => ({ ...d, avatarUrl: url }))}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            userId={data.userId}
            initial={data.overview}
            onSaved={(overview) => setData((d) => ({ ...d, overview }))}
          />
        </TabsContent>

        <TabsContent value="skills">
          <SkillsTab
            userId={data.userId}
            initial={data.skills}
            onChange={(skills) => setData((d) => ({ ...d, skills }))}
          />
        </TabsContent>

        <TabsContent value="education">
          <EducationTab
            userId={data.userId}
            initial={data.education}
            onChange={(education) => setData((d) => ({ ...d, education }))}
          />
        </TabsContent>

        <TabsContent value="certifications">
          <CertificationsTab
            userId={data.userId}
            initial={data.certifications}
            onChange={(certifications) => setData((d) => ({ ...d, certifications }))}
          />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesTab
            userId={data.userId}
            initial={data.jobPreferences}
            onSaved={(jobPreferences) => setData((d) => ({ ...d, jobPreferences }))}
          />
        </TabsContent>

        <TabsContent value="links">
          <LinksTab
            userId={data.userId}
            initial={data.socialLinks}
            onSaved={(socialLinks) => setData((d) => ({ ...d, socialLinks }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
