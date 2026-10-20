export type WhatsAppProvider = 'evolution' | 'meta_cloud';

export type UserRole = 'superadmin' | 'owner' | 'agent';

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  subaccountId?: string;
}

export interface WhatsAppConfig {
  provider: WhatsAppProvider;
  status: 'connected' | 'disconnected' | 'connecting';
  phone: string;
  instanceName?: string;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  metaPhoneNumberId?: string;
  metaAccessToken?: string;
  qrCodeUrl?: string;
}

export interface Subaccount {
  id: string;
  name: string;
  segment: string;
  logo: string;
  phone: string;
  email: string;
  whatsappConfig: WhatsAppConfig;
  gmbConnected: boolean;
  socialConnected: boolean;
}

export type LeadStatus = 'open' | 'won' | 'lost';

export interface Lead {
  id: string;
  subaccountId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  value: number;
  stageId: string;
  tags: string[];
  notes: string;
  createdAt: string;
  lastActivity: string;
  status: LeadStatus;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface WhatsAppMessage {
  id: string;
  contactId: string;
  sender: 'contact' | 'agent' | 'bot';
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  mediaUrl?: string;
  mediaType?: 'audio' | 'image' | 'video' | 'document';
  audioDuration?: number;
}

export interface AudioTrackItem {
  id: string;
  name: string;
  duration: number;
  url: string;
  createdAt: string;
  isCustom?: boolean;
}

export interface SequenceStepItem {
  id: string;
  type: 'text' | 'audio' | 'delay';
  title?: string;
  textContent?: string;
  audioId?: string;
  delaySeconds?: number;
  requireResponse?: boolean;
}

export interface WhatsAppContact {
  id: string;
  subaccountId: string;
  name: string;
  phone: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  tags: string[];
  assignedTo?: string;
  isDecisionMaker?: boolean;
  needsHumanAttention?: boolean;
  source?: string;
}

export interface GMBReview {
  id: string;
  subaccountId: string;
  authorName: string;
  authorPhoto?: string;
  rating: number; // 1 to 5
  comment: string;
  createTime: string;
  replyText?: string;
  replyTime?: string;
}

export interface GMBStats {
  views: number;
  searches: number;
  calls: number;
  directions: number;
  websiteClicks: number;
  ratingAverage: number;
  totalReviews: number;
}

export type SocialPlatform = 'instagram' | 'facebook' | 'linkedin';

export interface SocialPost {
  id: string;
  subaccountId: string;
  platforms: SocialPlatform[];
  content: string;
  mediaUrl?: string;
  scheduledDate: string;
  status: 'draft' | 'scheduled' | 'published';
  likes?: number;
  comments?: number;
}

export type WorkflowStepType = 'action' | 'condition' | 'delay' | 'webhook';

export type WorkflowActionType =
  | 'send_whatsapp'
  | 'add_tag'
  | 'remove_tag'
  | 'update_stage'
  | 'wait_delay'
  | 'send_webhook'
  | 'ai_toggle';

export type WorkflowConditionOperator = 'contains' | 'equals' | 'greater_than' | 'starts_with';

export interface WorkflowCondition {
  field: 'message' | 'tag' | 'lead_value' | 'rating' | 'stage';
  operator: WorkflowConditionOperator;
  value: string;
}

export interface WorkflowStep {
  id: string;
  stepOrder: number;
  stepType: WorkflowStepType;
  actionType?: WorkflowActionType;
  label: string;
  config?: {
    messageTemplate?: string;
    delayMinutes?: number;
    tag?: string;
    stageId?: string;
    webhookUrl?: string;
    aiEnabled?: boolean;
    condition?: WorkflowCondition;
    [key: string]: any;
  };
  branch?: 'yes' | 'no' | 'default';
  yesSteps?: WorkflowStep[];
  noSteps?: WorkflowStep[];
}

export interface WorkflowAction {
  id: string;
  type: 'send_whatsapp' | 'create_task' | 'update_stage' | 'add_tag' | 'notify_team' | 'wait_delay' | 'send_webhook' | 'ai_toggle';
  label: string;
  config: Record<string, any>;
}

export interface WorkflowRule {
  id: string;
  subaccountId: string;
  name: string;
  description: string;
  triggerType: 'lead_created' | 'stage_changed' | 'whatsapp_received' | 'gmb_review_received' | 'tag_added';
  triggerLabel: string;
  triggerConfig?: {
    keywords?: string[];
    minRating?: number;
    stageId?: string;
    tag?: string;
    [key: string]: any;
  };
  steps?: WorkflowStep[];
  actions: WorkflowAction[];
  isActive: boolean;
  totalExecutions: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProspectItem {
  id: string;
  name: string;
  phone: string;
  address: string;
  website?: string;
  rating: number;
  reviewsCount: number;
  category?: string;
  googleUrl?: string;
}

