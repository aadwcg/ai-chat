// components/Conversations/types.ts
import type { CSSProperties } from 'vue';

export interface ConversationsProps {
  items: any[];
  rowKey?: string;
  labelKey?: string;
  modelValue?: string | number;
  showTooltip?: boolean;
  labelMaxWidth?: number | string;
  itemsStyle?: CSSProperties;
  itemsActiveStyle?: CSSProperties;
  itemsHoverStyle?: CSSProperties;
  loadMore?: () => Promise<void>;
  loadMoreLoading?: boolean;
}
