export interface Step1Data {
  name: string;
  emoji: string;
  pmLeadName: string;
  techLeadName: string;
  teamName: string;
  targetDate: string;
}

export interface Step2Data {
  slackChannelIds: string[];
  linearTeamId: string;
  linearProjectId: string;
  notionPageId: string;
  notionTitle: string | null;
}

export interface Step3Data {
  productObjective: string;
  keyResults: { text: string; done: boolean }[];
  objectiveOrigin: 'notion' | 'manual';
}
