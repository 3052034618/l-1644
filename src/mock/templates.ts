import type { Template } from "../types";

export const templates: Template[] = [
  {
    id: "t001",
    name: "文本分类模板",
    dataType: "text",
    description: "适用于文本情感分析、主题分类、意图识别等文本标注场景",
    icon: "FileText",
  },
  {
    id: "t002",
    name: "图像标注模板",
    dataType: "image",
    description: "适用于目标检测、语义分割、关键点标注等图像标注场景",
    icon: "Image",
  },
  {
    id: "t003",
    name: "音频标注模板",
    dataType: "audio",
    description: "适用于语音转写、音频分类、说话人识别等音频标注场景",
    icon: "AudioLines",
  },
  {
    id: "t004",
    name: "视频标注模板",
    dataType: "video",
    description: "适用于行为识别、目标跟踪、事件标注等视频标注场景",
    icon: "Video",
  },
  {
    id: "t005",
    name: "文本实体标注模板",
    dataType: "text",
    description: "适用于命名实体识别、关系抽取等实体级别的文本标注场景",
    icon: "FileSearch",
  },
  {
    id: "t006",
    name: "图像分割模板",
    dataType: "image",
    description: "适用于医学影像、遥感图像等精细像素级分割标注场景",
    icon: "Scan",
  },
];
