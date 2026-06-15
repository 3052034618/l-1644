import type { Task, DataItem } from "../types";

const textDataItems: DataItem[] = [
  { id: "di001", content: "这款产品质量非常好，使用体验很棒，强烈推荐！", type: "text" },
  { id: "di002", content: "物流太慢了，等了半个月才到，非常不满意", type: "text" },
  { id: "di003", content: "一般般吧，没什么特别的，价格还行", type: "text" },
];

const imageDataItems: DataItem[] = [
  { id: "di004", content: "/images/autodrive_001.jpg", type: "image" },
  { id: "di005", content: "/images/autodrive_002.jpg", type: "image" },
  { id: "di006", content: "/images/autodrive_003.jpg", type: "image" },
];

const audioDataItems: DataItem[] = [
  { id: "di007", content: "/audio/call_001.wav", type: "audio" },
  { id: "di008", content: "/audio/call_002.wav", type: "audio" },
];

const videoDataItems: DataItem[] = [
  { id: "di009", content: "/video/clip_001.mp4", type: "video" },
  { id: "di010", content: "/video/clip_002.mp4", type: "video" },
];

const annotatedTextItems: DataItem[] = [
  {
    id: "di011",
    content: "这款手机拍照效果出色，续航也很给力",
    type: "text",
    annotation: { label: "正面", text: "拍照效果出色，续航也很给力" },
  },
  {
    id: "di012",
    content: "客服态度很差，问题一直没解决",
    type: "text",
    annotation: { label: "负面", text: "客服态度很差，问题一直没解决" },
  },
];

const annotatedImageItems: DataItem[] = [
  {
    id: "di013",
    content: "/images/autodrive_010.jpg",
    type: "image",
    annotation: {
      label: "目标检测",
      regions: [
        { x: 120, y: 80, width: 200, height: 150, label: "轿车" },
        { x: 450, y: 120, width: 60, height: 180, label: "行人" },
      ],
    },
  },
];

const annotatedAudioItems: DataItem[] = [
  {
    id: "di014",
    content: "/audio/call_010.wav",
    type: "audio",
    annotation: {
      label: "退款咨询",
      text: "您好，我想咨询一下退款流程",
      timestamp: 0,
    },
  },
];

export const tasks: Task[] = [
  {
    id: "task001",
    projectId: "p001",
    assigneeId: "u003",
    status: "in_progress",
    priority: "high",
    dataItems: textDataItems,
    createdAt: "2026-03-12T09:00:00Z",
  },
  {
    id: "task002",
    projectId: "p001",
    assigneeId: "u004",
    status: "submitted",
    priority: "medium",
    dataItems: annotatedTextItems,
    createdAt: "2026-03-12T09:30:00Z",
    submittedAt: "2026-03-14T16:00:00Z",
  },
  {
    id: "task003",
    projectId: "p002",
    assigneeId: "u004",
    status: "in_progress",
    priority: "high",
    dataItems: imageDataItems,
    createdAt: "2026-02-22T10:00:00Z",
  },
  {
    id: "task004",
    projectId: "p002",
    assigneeId: "u009",
    status: "reviewing",
    priority: "high",
    dataItems: annotatedImageItems,
    createdAt: "2026-02-22T10:30:00Z",
    submittedAt: "2026-03-01T14:00:00Z",
    accuracyRate: 0.92,
  },
  {
    id: "task005",
    projectId: "p003",
    assigneeId: "u006",
    status: "submitted",
    priority: "medium",
    dataItems: annotatedAudioItems,
    createdAt: "2026-01-18T08:00:00Z",
    submittedAt: "2026-02-10T17:30:00Z",
  },
  {
    id: "task006",
    projectId: "p003",
    assigneeId: "u006",
    status: "approved",
    priority: "low",
    dataItems: audioDataItems,
    createdAt: "2026-01-18T08:30:00Z",
    submittedAt: "2026-02-05T11:00:00Z",
    accuracyRate: 0.95,
  },
  {
    id: "task007",
    projectId: "p004",
    assigneeId: "u009",
    status: "in_progress",
    priority: "high",
    dataItems: videoDataItems,
    createdAt: "2026-04-02T09:00:00Z",
  },
  {
    id: "task008",
    projectId: "p001",
    assigneeId: "u003",
    status: "approved",
    priority: "medium",
    dataItems: textDataItems,
    createdAt: "2026-03-15T10:00:00Z",
    submittedAt: "2026-03-18T15:00:00Z",
    accuracyRate: 0.97,
  },
  {
    id: "task009",
    projectId: "p002",
    assigneeId: "u003",
    status: "rejected",
    priority: "high",
    dataItems: imageDataItems,
    createdAt: "2026-03-01T08:00:00Z",
    submittedAt: "2026-03-10T12:00:00Z",
    accuracyRate: 0.72,
    rejectReason: "多处目标遗漏，遮挡标注不规范",
  },
  {
    id: "task010",
    projectId: "p004",
    assigneeId: "u004",
    status: "pending",
    priority: "low",
    dataItems: videoDataItems,
    createdAt: "2026-04-05T11:00:00Z",
  },
  {
    id: "task011",
    projectId: "p007",
    assigneeId: "u006",
    status: "in_progress",
    priority: "medium",
    dataItems: audioDataItems,
    createdAt: "2026-04-16T09:00:00Z",
  },
  {
    id: "task012",
    projectId: "p001",
    assigneeId: "u009",
    status: "submitted",
    priority: "medium",
    dataItems: annotatedTextItems,
    createdAt: "2026-04-01T08:00:00Z",
    submittedAt: "2026-04-08T16:30:00Z",
  },
  {
    id: "task013",
    projectId: "p002",
    assigneeId: "u004",
    status: "in_progress",
    priority: "high",
    dataItems: imageDataItems,
    createdAt: "2026-04-10T09:30:00Z",
  },
  {
    id: "task014",
    projectId: "p006",
    assigneeId: "u003",
    status: "approved",
    priority: "low",
    dataItems: textDataItems,
    createdAt: "2025-11-05T08:00:00Z",
    submittedAt: "2025-12-01T14:00:00Z",
    accuracyRate: 0.98,
  },
  {
    id: "task015",
    projectId: "p007",
    assigneeId: "u006",
    status: "pending",
    priority: "medium",
    dataItems: audioDataItems,
    createdAt: "2026-04-20T10:00:00Z",
  },
  {
    id: "task016",
    projectId: "p004",
    assigneeId: "u009",
    status: "submitted",
    priority: "high",
    dataItems: videoDataItems,
    createdAt: "2026-04-08T08:30:00Z",
    submittedAt: "2026-04-20T17:00:00Z",
  },
  {
    id: "task017",
    projectId: "p001",
    assigneeId: "u003",
    status: "reviewing",
    priority: "medium",
    dataItems: annotatedTextItems,
    createdAt: "2026-04-12T09:00:00Z",
    submittedAt: "2026-04-18T15:30:00Z",
    accuracyRate: 0.88,
  },
];
