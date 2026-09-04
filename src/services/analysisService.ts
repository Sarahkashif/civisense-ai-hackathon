import type { Category, Priority, DuplicateResult, AnalysisResult, Complaint } from '../types';

/*
 * Analysis Service — Prototype / Local Heuristic Layer
 *
 * This module provides deterministic, transparent analysis using keyword matching
 * and weighted scoring. It does NOT use any external AI model or API.
 * The architecture is designed so each function can be replaced with a real
 * AI adapter in the future without changing calling code.
 */

// --- Keyword dictionaries for category detection ---
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  'Road Damage': [
    'road', 'pothole', 'crack', 'asphalt', 'pavement', 'highway', 'street damage',
    'broken road', 'damaged road', 'road surface', 'speed bump', 'sidewalk', 'footpath',
  ],
  'Garbage & Sanitation': [
    'garbage', 'trash', 'waste', 'litter', 'dumping', 'sanitation', 'dirty',
    'rubbish', 'debris', 'filth', 'cleaning', 'bin', 'dustbin', 'sweeping',
  ],
  'Water Supply / Leakage': [
    'water', 'leak', 'pipe', 'supply', 'tap', 'hydrant', 'burst', 'flooding',
    'water pressure', 'contaminated water', 'drinking water', 'tanker',
  ],
  'Drainage & Sewage': [
    'drain', 'sewage', 'sewer', 'blocked drain', 'overflow', 'manhole',
    'gutter', 'stormwater', 'foul smell', 'stagnant', 'clogged',
  ],
  'Street Lighting': [
    'light', 'lamp', 'streetlight', 'bulb', 'dark', 'lighting', 'pole',
    'flickering', 'outage', 'electric pole', 'street light',
  ],
  'Public Infrastructure': [
    'park', 'bench', 'fence', 'playground', 'public toilet', 'bus stop',
    'signboard', 'traffic signal', 'bridge', 'building', 'wall', 'gate',
  ],
  'Other': [],
};

// Emergency / urgency keywords that boost priority
const URGENCY_KEYWORDS = [
  'urgent', 'emergency', 'danger', 'dangerous', 'accident', 'injured',
  'risk', 'hazard', 'hazardous', 'critical', 'immediate', 'blocked',
  'overflowing', 'collapsed', 'electrocution', 'fire', 'gas leak',
];

// Context/location risk keywords (up to 20 points, 5 per match, max 4)
const LOCATION_RISK_KEYWORDS = [
  'school', 'hospital', 'mosque', 'market', 'crossing', 'intersection',
  'main road', 'highway', 'road center', 'middle of road', 'center of road',
  'children', 'elderly', 'pedestrian', 'playground', 'busy', 'crowded',
  'near school', 'near hospital', 'residential',
];

// Life safety keywords (up to 20 points, 10 per match, max 2)
const LIFE_SAFETY_KEYWORDS = [
  'death', 'killed', 'fatal', 'life-threatening', 'electrocution',
  'collapsed', 'drowning', 'gas leak', 'fire', 'explosion',
  'serious injury', 'loss of life', 'trap', 'trapped',
  'accident', 'injury', 'injured', 'crash', 'run over',
  'disease', 'outbreak', 'epidemic', 'contamination', 'contaminated',
  'patients', 'ambulance', 'health emergency', 'disease outbreak',
];

// Base severity scores per category (0-35)
const CATEGORY_SEVERITY: Record<Category, number> = {
  'Road Damage': 25,
  'Garbage & Sanitation': 20,
  'Water Supply / Leakage': 28,
  'Drainage & Sewage': 26,
  'Street Lighting': 22,
  'Public Infrastructure': 18,
  'Other': 15,
};

/**
 * Suggest a category based on keyword matching against title and description.
 * Returns the category with the highest keyword match count.
 */
export function suggestCategory(
  title: string,
  description: string,
  userSelection?: Category | null
): { category: Category; confidence: string } {
  // If user explicitly selected a category, honor it
  if (userSelection) {
    return { category: userSelection, confidence: 'User-selected' };
  }

  const text = `${title} ${description}`.toLowerCase();
  let bestCategory: Category = 'Other';
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === 'Other') continue;
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat as Category;
    }
  }

  const confidence =
    bestScore >= 3 ? 'High confidence' : bestScore >= 1 ? 'Moderate confidence' : 'Low confidence — please verify';

  return { category: bestCategory, confidence };
}

/**
 * Calculate priority score (0-100) with risk-aware, context-sensitive scoring.
 *
 * Factors:
 * - Base category severity: 0-35 points
 * - Context/location risk: 0-20 points (school, hospital, road center, etc.)
 * - Life safety keywords: 0-20 points (death, fatal, fire, etc.)
 * - General urgency keywords: up to 15 points
 * - Duplicate reports at similar location: up to 10 points
 * - Support count: up to 5 points
 */
export function calculatePriority(
  title: string,
  description: string,
  category: Category,
  existingComplaints: Complaint[],
  location: string,
  supportCount: number = 0
): { score: number; priority: Priority; explanation: string } {
  const text = `${title} ${description} ${location}`.toLowerCase();
  const explanations: string[] = [];

  // 1. Base category severity (0-35)
  const baseSeverity = CATEGORY_SEVERITY[category] || 15;
  explanations.push(`Base severity for ${category}: ${baseSeverity}/35`);

  // 2. Context/location risk (up to 20 points, 5 per match, max 4)
  let locationRiskScore = 0;
  const foundLocationRisks: string[] = [];
  for (const kw of LOCATION_RISK_KEYWORDS) {
    if (text.includes(kw)) {
      foundLocationRisks.push(kw);
      locationRiskScore += 5;
      if (locationRiskScore >= 20) break;
    }
  }
  if (foundLocationRisks.length > 0) {
    explanations.push(`Location/context risk (${foundLocationRisks.join(', ')}): +${locationRiskScore}`);
  }

  // 3. Life safety keywords (up to 20 points, 10 per match, max 2)
  let lifeSafetyScore = 0;
  const foundLifeSafety: string[] = [];
  for (const kw of LIFE_SAFETY_KEYWORDS) {
    if (text.includes(kw)) {
      foundLifeSafety.push(kw);
      lifeSafetyScore += 10;
      if (lifeSafetyScore >= 20) break;
    }
  }
  if (foundLifeSafety.length > 0) {
    explanations.push(`Life safety risk (${foundLifeSafety.join(', ')}): +${lifeSafetyScore}`);
  }

  // 4. General urgency keywords (up to 15 points, 5 per keyword, max 3)
  let urgencyScore = 0;
  const foundUrgency: string[] = [];
  for (const kw of URGENCY_KEYWORDS) {
    if (text.includes(kw)) {
      foundUrgency.push(kw);
      urgencyScore += 5;
      if (urgencyScore >= 15) break;
    }
  }
  if (foundUrgency.length > 0) {
    explanations.push(`Urgency indicators (${foundUrgency.join(', ')}): +${urgencyScore}`);
  }

  // 5. Duplicate / repeated reports at similar location (up to 10)
  const normalizedLoc = normalizeLocation(location);
  const similarReports = existingComplaints.filter(
    (c) => normalizeLocation(c.location) === normalizedLoc && c.id !== ''
  );
  let duplicateBoost = Math.min(similarReports.length * 5, 10);
  if (duplicateBoost > 0) {
    explanations.push(`${similarReports.length} similar report(s) at this location: +${duplicateBoost}`);
  }

  // 6. Support count (up to 5)
  const supportBoost = Math.min(supportCount * 2, 5);
  if (supportBoost > 0) {
    explanations.push(`Community support (${supportCount}): +${supportBoost}`);
  }

  // 7. Compound risk bonus: dangerous hazard in a high-risk location
  // A hazard near a school/hospital/market WITH urgency/life-safety indicators
  // is genuinely dangerous and must not be rated Medium
  let compoundBonus = 0;
  if (locationRiskScore >= 10 && (lifeSafetyScore > 0 || urgencyScore >= 10)) {
    compoundBonus = 10;
    explanations.push(`Compound risk (dangerous hazard at high-risk location): +${compoundBonus}`);
  }

  const score = Math.min(baseSeverity + locationRiskScore + lifeSafetyScore + urgencyScore + duplicateBoost + supportBoost + compoundBonus, 100);

  const priority: Priority = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';

  const explanation = `${priority} priority — ${explanations.join('; ')}.`;

  return { score, priority, explanation };
}

/**
 * Detect likely duplicates among existing complaints.
 * Uses category match, keyword overlap, and location similarity.
 */
export function detectDuplicates(
  title: string,
  description: string,
  category: Category,
  location: string,
  existingComplaints: Complaint[]
): DuplicateResult {
  if (existingComplaints.length === 0) {
    return { status: 'No likely duplicate', matchId: null, matchTitle: null, confidence: 0 };
  }

  const normalizedLoc = normalizeLocation(location);
  const inputWords = tokenize(`${title} ${description}`);
  let bestMatch: Complaint | null = null;
  let bestScore = 0;

  for (const c of existingComplaints) {
    if (c.status === 'Resolved') continue;

    let score = 0;

    // Category match
    if (c.finalCategory === category) score += 30;

    // Location match
    if (normalizeLocation(c.location) === normalizedLoc) score += 30;

    // Keyword overlap
    const candidateWords = tokenize(`${c.title} ${c.description}`);
    const overlap = intersectionSize(inputWords, candidateWords);
    const overlapRatio = inputWords.size > 0 ? overlap / inputWords.size : 0;
    score += Math.round(overlapRatio * 40);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = c;
    }
  }

  if (bestScore >= 60 && bestMatch) {
    return {
      status: 'Likely duplicate',
      matchId: bestMatch.id,
      matchTitle: bestMatch.title,
      confidence: bestScore,
    };
  }
  if (bestScore >= 35 && bestMatch) {
    return {
      status: 'Possible duplicate',
      matchId: bestMatch.id,
      matchTitle: bestMatch.title,
      confidence: bestScore,
    };
  }

  return { status: 'No likely duplicate', matchId: null, matchTitle: null, confidence: bestScore };
}

/**
 * Run full analysis pipeline on a complaint submission.
 */
export function analyzeComplaint(
  title: string,
  description: string,
  location: string,
  userCategory: Category | null,
  existingComplaints: Complaint[]
): AnalysisResult {
  const { category, confidence } = suggestCategory(title, description, userCategory);
  const { score, priority, explanation } = calculatePriority(
    title, description, category, existingComplaints, location
  );
  const duplicate = detectDuplicates(title, description, category, location, existingComplaints);

  return {
    category,
    categoryConfidence: confidence,
    priority,
    priorityScore: score,
    priorityExplanation: explanation,
    duplicate,
  };
}

// --- Utility functions ---

function normalizeLocation(loc: string): string {
  return loc.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[,.\-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): Set<string> {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'it', 'this', 'that', 'with', 'from', 'by', 'as', 'be', 'has', 'had', 'have', 'not', 'but', 'can', 'will', 'its', 'my', 'our', 'near', 'i', 'we', 'they']);
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w))
  );
}

function intersectionSize(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const item of a) {
    if (b.has(item)) count++;
  }
  return count;
}

// --- Future AI adapter interface (stubs) ---
// These can be replaced with real API calls in production.
export async function analyzeText(_text: string): Promise<string> {
  return 'Local heuristic analysis — not a trained AI model.';
}

export async function analyzeImage(_imageData: string): Promise<string> {
  return 'Image stored for authority review. No automated image analysis in local MVP.';
}

export async function transcribeVoice(_audioBlob: Blob): Promise<string> {
  return 'Voice transcription handled by browser Web Speech API.';
}
