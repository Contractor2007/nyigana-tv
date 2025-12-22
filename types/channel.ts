export interface Channel {
  id: number;
  title: string;
  description: string;
  url: string;
  type: string;
  quality: string;
  region: string;
  category: string;
  icon: string;
  active: boolean;
  isTest?: boolean;
}

export interface ChannelStats {
  total: number;
  sports: number;
  regions: number;
  online: number;
}