import type { Profile } from "./people";

// Made-up brothers for guests (like graders), so they see the same People page
// and profiles as members without seeing real members' details. For the
// course only: after it, guests won't get People at all.
const sample = (p: Omit<Profile, "email" | "imageUrl" | "linkedin">): Profile => ({
  ...p,
  email: `${p.name.split(" ")[0].toLowerCase()}@example.com`,
  imageUrl: null,
  linkedin: null,
});

export const SAMPLE_PROFILES: Profile[] = [
  sample({ id: "sample-1", name: "Avery Chen", type: "board", pronouns: "she/her", year: "2027", major: "Computer Science", minor: "Economics", hometown: "San Jose, CA", pledgeClass: "Alpha", interests: ["Product", "Running", "Coffee"], about: "Chapter president. Ask me about internships or the best study spots on campus." }),
  sample({ id: "sample-2", name: "Jordan Patel", type: "board", pronouns: "he/him", year: "2028", major: "Data Science", minor: null, hometown: "Edison, NJ", pledgeClass: "Beta", interests: ["ML", "Basketball"], about: "VP of Professional Development. I run resume reviews every quarter." }),
  sample({ id: "sample-3", name: "Maya Rodriguez", type: "brother", pronouns: "she/her", year: "2028", major: "Computer Science, Mathematics", minor: null, hometown: "Houston, TX", pledgeClass: "Beta", interests: ["Algorithms", "Climbing"], about: null }),
  sample({ id: "sample-4", name: "Ethan Brooks", type: "brother", pronouns: "he/him", year: "2029", major: "Economics", minor: "Computer Science", hometown: "Chicago, IL", pledgeClass: "Gamma", interests: ["Fintech", "Chess"], about: "Always down to grab food at the Reg." }),
  sample({ id: "sample-5", name: "Priya Nair", type: "brother", pronouns: "she/her", year: "2029", major: "Cognitive Science", minor: "Computer Science", hometown: "Seattle, WA", pledgeClass: "Gamma", interests: ["Design", "Photography"], about: null }),
  sample({ id: "sample-6", name: "Sam Okafor", type: "brother", pronouns: "they/them", year: "2028", major: "Physics", minor: null, hometown: "Atlanta, GA", pledgeClass: "Beta", interests: ["Quantum computing"], about: null }),
  sample({ id: "sample-7", name: "Lena Fischer", type: "pledge", pronouns: "she/her", year: "2030", major: "Undeclared", minor: null, hometown: "Denver, CO", pledgeClass: "Delta", interests: ["Web dev"], about: null }),
  sample({ id: "sample-8", name: "Marcus Kim", type: "alumni", pronouns: "he/him", year: "2026", major: "Computer Science", minor: null, hometown: "Los Angeles, CA", pledgeClass: "Alpha", interests: ["Startups"], about: "Software engineer now. Happy to chat about recruiting." }),
];

export const getSampleProfile = (id: string) => SAMPLE_PROFILES.find((p) => p.id === id) ?? null;
