import { Model, Connection } from 'mongoose';
import { TeamRole, FileType, FileVisibility } from '@cloudfiles/contracts';

export interface SeedData {
  users: Record<string, { id: string; email: string; name: string }>;
  teams: Record<string, { id: string; name: string }>;
  folders: Record<string, { id: string; name: string; teamId: string }>;
  files: Record<string, { id: string; name: string; visibility: FileVisibility }>;
}

export interface SeedModels {
  userModel: Model<any>;
  teamModel: Model<any>;
  membershipModel: Model<any>;
  folderModel: Model<any>;
  fileModel: Model<any>;
}

/**
 * Clears all collections in the database
 */
export async function clearDatabase(connection: Connection): Promise<void> {
  const collections = connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Seeds the database with test data.
 *
 * Creates:
 * - Users: Alice (Team A OWNER), Bob (Team A MEMBER), Charlie (Team B MEMBER)
 * - Teams: Team A, Team B
 * - Folders with various files having different visibility settings
 */
export async function seedDatabase(models: SeedModels): Promise<SeedData> {
  const { userModel, teamModel, membershipModel, folderModel, fileModel } = models;

  // Clear existing data
  await userModel.deleteMany({});
  await teamModel.deleteMany({});
  await membershipModel.deleteMany({});
  await folderModel.deleteMany({});
  await fileModel.deleteMany({});

  // Create users
  const alice = await userModel.create({
    email: 'alice@example.com',
    name: 'Alice',
  });

  const bob = await userModel.create({
    email: 'bob@example.com',
    name: 'Bob',
  });

  const charlie = await userModel.create({
    email: 'charlie@example.com',
    name: 'Charlie',
  });

  console.log('Created users:');
  console.log(`  Alice: ${alice._id}`);
  console.log(`  Bob: ${bob._id}`);
  console.log(`  Charlie: ${charlie._id}`);

  // Create teams
  const teamA = await teamModel.create({
    name: 'Team A',
  });

  const teamB = await teamModel.create({
    name: 'Team B',
  });

  console.log('Created teams:');
  console.log(`  Team A: ${teamA._id}`);
  console.log(`  Team B: ${teamB._id}`);

  // Create memberships
  await membershipModel.create({
    userId: alice._id,
    teamId: teamA._id,
    role: TeamRole.OWNER,
  });

  await membershipModel.create({
    userId: bob._id,
    teamId: teamA._id,
    role: TeamRole.MEMBER,
  });

  await membershipModel.create({
    userId: charlie._id,
    teamId: teamB._id,
    role: TeamRole.MEMBER,
  });

  console.log('Created memberships:');
  console.log(`  Alice -> Team A (OWNER)`);
  console.log(`  Bob -> Team A (MEMBER)`);
  console.log(`  Charlie -> Team B (MEMBER)`);

  // Create folders
  const financeFolder = await folderModel.create({
    teamId: teamA._id,
    name: 'Finance',
    parentId: null,
  });

  const generalFolder = await folderModel.create({
    teamId: teamB._id,
    name: 'General',
    parentId: null,
  });

  console.log('Created folders:');
  console.log(`  Finance (Team A): ${financeFolder._id}`);
  console.log(`  General (Team B): ${generalFolder._id}`);

  // Create more folders for Team A
  const hrFolder = await folderModel.create({
    teamId: teamA._id,
    name: 'HR Documents',
    parentId: null,
  });

  const projectsFolder = await folderModel.create({
    teamId: teamA._id,
    name: 'Projects',
    parentId: null,
  });

  // Create more folders for Team B
  const marketingFolder = await folderModel.create({
    teamId: teamB._id,
    name: 'Marketing',
    parentId: null,
  });

  const designFolder = await folderModel.create({
    teamId: teamB._id,
    name: 'Design Assets',
    parentId: null,
  });

  console.log('Created additional folders:');
  console.log(`  HR Documents (Team A): ${hrFolder._id}`);
  console.log(`  Projects (Team A): ${projectsFolder._id}`);
  console.log(`  Marketing (Team B): ${marketingFolder._id}`);
  console.log(`  Design Assets (Team B): ${designFolder._id}`);

  // Create files in Finance folder
  const budget2025 = await fileModel.create({
    teamId: teamA._id,
    folderId: financeFolder._id,
    name: 'budget-2025.pdf',
    type: FileType.PDF,
    sizeBytes: 1024 * 1024 * 2, // 2MB
    tags: ['budget', 'finance', '2025'],
    visibility: FileVisibility.OWNER_ONLY,
  });

  const roadmap = await fileModel.create({
    teamId: teamA._id,
    folderId: financeFolder._id,
    name: 'roadmap.pdf',
    type: FileType.PDF,
    sizeBytes: 1024 * 512, // 512KB
    tags: ['roadmap', 'planning'],
    visibility: FileVisibility.TEAM,
  });

  const expenseReport = await fileModel.create({
    teamId: teamA._id,
    folderId: financeFolder._id,
    name: 'expense-report-q4.pdf',
    type: FileType.PDF,
    sizeBytes: 1024 * 256, // 256KB
    tags: ['expenses', 'q4', 'report'],
    visibility: FileVisibility.TEAM,
  });

  const investorDeck = await fileModel.create({
    teamId: teamA._id,
    folderId: financeFolder._id,
    name: 'investor-deck-confidential.pdf',
    type: FileType.PDF,
    sizeBytes: 1024 * 1024 * 5, // 5MB
    tags: ['investor', 'confidential', 'deck'],
    visibility: FileVisibility.OWNER_ONLY,
  });

  console.log('Created files in Finance folder:');
  console.log(`  budget-2025.pdf (OWNER_ONLY): ${budget2025._id}`);
  console.log(`  roadmap.pdf (TEAM): ${roadmap._id}`);
  console.log(`  expense-report-q4.pdf (TEAM): ${expenseReport._id}`);
  console.log(`  investor-deck-confidential.pdf (OWNER_ONLY): ${investorDeck._id}`);

  // Create files in HR Documents folder
  const employeeHandbook = await fileModel.create({
    teamId: teamA._id,
    folderId: hrFolder._id,
    name: 'employee-handbook.pdf',
    type: FileType.PDF,
    sizeBytes: 1024 * 1024 * 1, // 1MB
    tags: ['handbook', 'policies', 'hr'],
    visibility: FileVisibility.TEAM,
  });

  const salaryStructure = await fileModel.create({
    teamId: teamA._id,
    folderId: hrFolder._id,
    name: 'salary-structure-2025.pdf',
    type: FileType.PDF,
    sizeBytes: 1024 * 128, // 128KB
    tags: ['salary', 'compensation', 'confidential'],
    visibility: FileVisibility.OWNER_ONLY,
  });

  const orgChart = await fileModel.create({
    teamId: teamA._id,
    folderId: hrFolder._id,
    name: 'org-chart.png',
    type: FileType.IMG,
    sizeBytes: 1024 * 512, // 512KB
    tags: ['org-chart', 'structure'],
    visibility: FileVisibility.TEAM,
  });

  console.log('Created files in HR Documents folder:');
  console.log(`  employee-handbook.pdf (TEAM): ${employeeHandbook._id}`);
  console.log(`  salary-structure-2025.pdf (OWNER_ONLY): ${salaryStructure._id}`);
  console.log(`  org-chart.png (TEAM): ${orgChart._id}`);

  // Create files in Projects folder
  const projectPlan = await fileModel.create({
    teamId: teamA._id,
    folderId: projectsFolder._id,
    name: 'project-alpha-plan.doc',
    type: FileType.DOC,
    sizeBytes: 1024 * 384, // 384KB
    tags: ['project', 'alpha', 'planning'],
    visibility: FileVisibility.TEAM,
  });

  const technicalSpec = await fileModel.create({
    teamId: teamA._id,
    folderId: projectsFolder._id,
    name: 'technical-specification.doc',
    type: FileType.DOC,
    sizeBytes: 1024 * 768, // 768KB
    tags: ['technical', 'spec', 'architecture'],
    visibility: FileVisibility.TEAM,
  });

  const clientContract = await fileModel.create({
    teamId: teamA._id,
    folderId: projectsFolder._id,
    name: 'client-contract-draft.pdf',
    type: FileType.PDF,
    sizeBytes: 1024 * 1024 * 1, // 1MB
    tags: ['contract', 'client', 'legal'],
    visibility: FileVisibility.OWNER_ONLY,
  });

  console.log('Created files in Projects folder:');
  console.log(`  project-alpha-plan.doc (TEAM): ${projectPlan._id}`);
  console.log(`  technical-specification.doc (TEAM): ${technicalSpec._id}`);
  console.log(`  client-contract-draft.pdf (OWNER_ONLY): ${clientContract._id}`);

  // Create files in General folder (Team B)
  const welcomeGuide = await fileModel.create({
    teamId: teamB._id,
    folderId: generalFolder._id,
    name: 'welcome-guide.pdf',
    type: FileType.PDF,
    sizeBytes: 1024 * 256, // 256KB
    tags: ['welcome', 'onboarding'],
    visibility: FileVisibility.TEAM,
  });

  const meetingNotes = await fileModel.create({
    teamId: teamB._id,
    folderId: generalFolder._id,
    name: 'team-meeting-notes.doc',
    type: FileType.DOC,
    sizeBytes: 1024 * 64, // 64KB
    tags: ['meeting', 'notes'],
    visibility: FileVisibility.TEAM,
  });

  console.log('Created files in General folder:');
  console.log(`  welcome-guide.pdf (TEAM): ${welcomeGuide._id}`);
  console.log(`  team-meeting-notes.doc (TEAM): ${meetingNotes._id}`);

  // Create files in Marketing folder
  const brandGuidelines = await fileModel.create({
    teamId: teamB._id,
    folderId: marketingFolder._id,
    name: 'brand-guidelines.pdf',
    type: FileType.PDF,
    sizeBytes: 1024 * 1024 * 3, // 3MB
    tags: ['brand', 'guidelines', 'marketing'],
    visibility: FileVisibility.TEAM,
  });

  const campaignBudget = await fileModel.create({
    teamId: teamB._id,
    folderId: marketingFolder._id,
    name: 'campaign-budget-q1.pdf',
    type: FileType.PDF,
    sizeBytes: 1024 * 192, // 192KB
    tags: ['budget', 'campaign', 'q1'],
    visibility: FileVisibility.OWNER_ONLY,
  });

  const socialMediaPlan = await fileModel.create({
    teamId: teamB._id,
    folderId: marketingFolder._id,
    name: 'social-media-plan.doc',
    type: FileType.DOC,
    sizeBytes: 1024 * 128, // 128KB
    tags: ['social', 'marketing', 'plan'],
    visibility: FileVisibility.TEAM,
  });

  const productPhotos = await fileModel.create({
    teamId: teamB._id,
    folderId: marketingFolder._id,
    name: 'product-photos.zip',
    type: FileType.OTHER,
    sizeBytes: 1024 * 1024 * 25, // 25MB
    tags: ['photos', 'product', 'assets'],
    visibility: FileVisibility.TEAM,
  });

  console.log('Created files in Marketing folder:');
  console.log(`  brand-guidelines.pdf (TEAM): ${brandGuidelines._id}`);
  console.log(`  campaign-budget-q1.pdf (OWNER_ONLY): ${campaignBudget._id}`);
  console.log(`  social-media-plan.doc (TEAM): ${socialMediaPlan._id}`);
  console.log(`  product-photos.zip (TEAM): ${productPhotos._id}`);

  // Create files in Design Assets folder
  const logo = await fileModel.create({
    teamId: teamB._id,
    folderId: designFolder._id,
    name: 'logo-primary.png',
    type: FileType.IMG,
    sizeBytes: 1024 * 256, // 256KB
    tags: ['logo', 'brand', 'primary'],
    visibility: FileVisibility.TEAM,
  });

  const iconSet = await fileModel.create({
    teamId: teamB._id,
    folderId: designFolder._id,
    name: 'icon-set-v2.zip',
    type: FileType.OTHER,
    sizeBytes: 1024 * 1024 * 8, // 8MB
    tags: ['icons', 'design', 'ui'],
    visibility: FileVisibility.TEAM,
  });

  const wireframes = await fileModel.create({
    teamId: teamB._id,
    folderId: designFolder._id,
    name: 'app-wireframes.png',
    type: FileType.IMG,
    sizeBytes: 1024 * 1024 * 2, // 2MB
    tags: ['wireframes', 'ux', 'design'],
    visibility: FileVisibility.TEAM,
  });

  const mockups = await fileModel.create({
    teamId: teamB._id,
    folderId: designFolder._id,
    name: 'final-mockups-confidential.png',
    type: FileType.IMG,
    sizeBytes: 1024 * 1024 * 4, // 4MB
    tags: ['mockups', 'confidential', 'final'],
    visibility: FileVisibility.OWNER_ONLY,
  });

  console.log('Created files in Design Assets folder:');
  console.log(`  logo-primary.png (TEAM): ${logo._id}`);
  console.log(`  icon-set-v2.zip (TEAM): ${iconSet._id}`);
  console.log(`  app-wireframes.png (TEAM): ${wireframes._id}`);
  console.log(`  final-mockups-confidential.png (OWNER_ONLY): ${mockups._id}`);

  console.log('\n=== Seed Data Summary ===');
  console.log('Users: 3 (Alice, Bob, Charlie)');
  console.log('Teams: 2 (Team A, Team B)');
  console.log('Folders: 6 (Finance, HR Documents, Projects, General, Marketing, Design Assets)');
  console.log('Files: 20 total');

  return {
    users: {
      alice: { id: alice._id.toString(), email: alice.email, name: alice.name },
      bob: { id: bob._id.toString(), email: bob.email, name: bob.name },
      charlie: { id: charlie._id.toString(), email: charlie.email, name: charlie.name },
    },
    teams: {
      teamA: { id: teamA._id.toString(), name: teamA.name },
      teamB: { id: teamB._id.toString(), name: teamB.name },
    },
    folders: {
      finance: { id: financeFolder._id.toString(), name: financeFolder.name, teamId: teamA._id.toString() },
      hrDocuments: { id: hrFolder._id.toString(), name: hrFolder.name, teamId: teamA._id.toString() },
      projects: { id: projectsFolder._id.toString(), name: projectsFolder.name, teamId: teamA._id.toString() },
      general: { id: generalFolder._id.toString(), name: generalFolder.name, teamId: teamB._id.toString() },
      marketing: { id: marketingFolder._id.toString(), name: marketingFolder.name, teamId: teamB._id.toString() },
      designAssets: { id: designFolder._id.toString(), name: designFolder.name, teamId: teamB._id.toString() },
    },
    files: {
      budget2025: { id: budget2025._id.toString(), name: budget2025.name, visibility: budget2025.visibility },
      roadmap: { id: roadmap._id.toString(), name: roadmap.name, visibility: roadmap.visibility },
      expenseReport: { id: expenseReport._id.toString(), name: expenseReport.name, visibility: expenseReport.visibility },
      investorDeck: { id: investorDeck._id.toString(), name: investorDeck.name, visibility: investorDeck.visibility },
      employeeHandbook: { id: employeeHandbook._id.toString(), name: employeeHandbook.name, visibility: employeeHandbook.visibility },
      salaryStructure: { id: salaryStructure._id.toString(), name: salaryStructure.name, visibility: salaryStructure.visibility },
      orgChart: { id: orgChart._id.toString(), name: orgChart.name, visibility: orgChart.visibility },
      projectPlan: { id: projectPlan._id.toString(), name: projectPlan.name, visibility: projectPlan.visibility },
      technicalSpec: { id: technicalSpec._id.toString(), name: technicalSpec.name, visibility: technicalSpec.visibility },
      clientContract: { id: clientContract._id.toString(), name: clientContract.name, visibility: clientContract.visibility },
      welcomeGuide: { id: welcomeGuide._id.toString(), name: welcomeGuide.name, visibility: welcomeGuide.visibility },
      meetingNotes: { id: meetingNotes._id.toString(), name: meetingNotes.name, visibility: meetingNotes.visibility },
      brandGuidelines: { id: brandGuidelines._id.toString(), name: brandGuidelines.name, visibility: brandGuidelines.visibility },
      campaignBudget: { id: campaignBudget._id.toString(), name: campaignBudget.name, visibility: campaignBudget.visibility },
      socialMediaPlan: { id: socialMediaPlan._id.toString(), name: socialMediaPlan.name, visibility: socialMediaPlan.visibility },
      productPhotos: { id: productPhotos._id.toString(), name: productPhotos.name, visibility: productPhotos.visibility },
      logo: { id: logo._id.toString(), name: logo.name, visibility: logo.visibility },
      iconSet: { id: iconSet._id.toString(), name: iconSet.name, visibility: iconSet.visibility },
      wireframes: { id: wireframes._id.toString(), name: wireframes.name, visibility: wireframes.visibility },
      mockups: { id: mockups._id.toString(), name: mockups.name, visibility: mockups.visibility },
    },
  };
}
