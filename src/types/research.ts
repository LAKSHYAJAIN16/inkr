export interface ResearchActivity {
  id: string;
  timestamp: string;
  type: 'search' | 'click' | 'navigation' | 'scroll' | 'focus' | 'blur' | 'keypress' | 'keydown' | 'mousemove' | 'input';
  data: {
    query?: string;
    url?: string;
    element?: string;
    position?: { x: number; y: number };
    duration?: number;
    key?: string;
    code?: string;
    modifiers?: {
      ctrl?: boolean;
      shift?: boolean;
      alt?: boolean;
      meta?: boolean;
    };
    button?: number;
    clickCount?: number;
    moveCount?: number;
    scrollX?: number;
    scrollY?: number;
    value?: string;
    inputType?: string;
    inputName?: string;
    target?: string;
    href?: string;
    [key: string]: any;
  };
}

export interface ResearchSession {
  id: string;
  startTime: string;
  endTime?: string;
  activities: ResearchActivity[];
  totalSearches: number;
  totalClicks: number;
  totalTimeSpent: number;
}

export interface ResearchSessionSummary {
  id: string;
  startTime: string;
  endTime?: string;
  totalSearches: number;
  totalClicks: number;
  totalTimeSpent: number;
  activityCount: number;
}
