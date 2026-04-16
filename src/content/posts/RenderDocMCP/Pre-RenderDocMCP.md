---
title: Pre-RenderDocMCP
published: 2026-04-16
description: 'AI自动化分析逆向工具'
image: './0.png'
tags: [AI,MCP,小工具,RenderDoc,模型提取,贴图提取]
category: ''
draft: false 
lang: 'zh_CN'
---

# RenderDoc MCP Server 详细分析报告

> **版本**: v1.6.0 | **工具数量**: 37 个 | **日期**: 2026-04-16

:::warning
该自研的RenderDocMCP源码并不会分享出来，本文章仅作为制作成果分享展示
:::

---

## 一、项目概述

### 1.1 项目定位

RenderDoc MCP Server 是一个基于 **MCP（Model Context Protocol）** 协议的服务器，将 RenderDoc GPU 截帧分析工具的全部能力暴露给 AI 智能体。用户通过自然语言对话即可完成渲染管线分析、Shader 逆向、模型和贴图导出等工作。

### 1.2 解决的痛点

| 传统手工流程 | 耗时 | MCP 自动化 | 耗时 |
|------------|:----:|-----------|:----:|
| 手动翻 DrawCall 列表 | 10min | `identify_drawcalls()` 自动识别 | 5s |
| 逐个点击看 Pipeline State | 15min | `reverse_shader()` 一站式返回 | 3s |
| 手动导出+重命名贴图 | 20min | `save_texture()` 自动命名+角色识别 | 2s |
| 翻 SPIR-V 汇编猜灯光模型 | 30min | `analyze_lighting()` 自动检测 | 3s |
| 导出模型+格式转换+导入 Unity | 30min | `export_to_unity()` 一键完成 | 5s |
| **完整角色逆向分析** | **2-3 小时** | **对话式自动完成** | **< 5 分钟** |

### 1.3 三层架构

```
┌─────────────┐     stdio      ┌──────────────────┐    文件IPC     ┌──────────────────┐
│  AI / IDE   │ ◄────────────► │  MCP Server      │ ◄────────────► │  RenderDoc 扩展  │
│ (WorkBuddy) │                │  (Python 3.10+)  │                │  (Python 3.6)    │
│             │                │  server.py       │                │  __init__.py     │
└─────────────┘                └──────────────────┘                └──────────────────┘
                                       │                                    │
                                  37 个 MCP 工具                    pyrenderdoc API
                                                                   (renderdoc.dll)
```

**为什么需要文件 IPC？** RenderDoc 内置 Python 3.6，MCP 框架需要 Python 3.10+。两个版本无法共存，通过 `%TEMP%/renderdoc_mcp_ipc/` 目录下的 JSON 文件交换数据。

### 1.4 项目结构

```
renderdoc-mcp/
├── pyproject.toml          # 项目配置（v1.6.0, Python ≥3.10, 依赖 mcp[cli]）
├── src/
│   ├── server.py           # MCP 工具注册（37 个工具，基于 FastMCP）
│   ├── ipc_client.py       # 文件 IPC 客户端（timeout=30s）
│   └── rd_wrapper.py       # RenderDoc API 直连封装（备用方案）
│
RenderDoc 扩展（单独安装）：
  %APPDATA%/qrenderdoc/extensions/renderdoc_mcp_bridge/__init__.py
  (~3400 行，执行 GPU 命令，通过 IPC 返回结果)
```

### 1.5 技术栈

| 组件 | 技术 |
|------|------|
| MCP 框架 | FastMCP (mcp[cli] ≥1.0.0) |
| 通信协议 | stdio (AI↔Server) + 文件 IPC (Server↔Bridge) |
| GPU API | D3D11 ✅ / D3D12 ✅ / Vulkan ✅ / OpenGL ✅ |
| 导出格式 | OBJ, FBX 7.4 ASCII, PNG, JPG, BMP, TGA, HDR, EXR, DDS |
| 后处理依赖 | Pillow + numpy（MCP Server 端） |

---

## 二、37 个工具详解

### 类别一：截帧管理（6 个）

| # | 工具 | 参数 | 功能 | 返回 |
|:-:|------|------|------|------|
| 1 | `ping` | 无 | 检查 RenderDoc Bridge 是否在线 | `{status: "ok"}` |
| 2 | `get_capture_status` | 无 | 检查是否已加载截帧，获取 API 信息 | `{loaded, api, renderer}` |
| 3 | `list_captures` | `directory: str` | 列出指定目录下的 .rdc 文件 | `[{path, size, date}, ...]` |
| 4 | `open_capture` | `capture_path: str` | 在运行中的 RenderDoc 里打开 .rdc 文件 | `{opened, path}` |
| 5 | `launch_renderdoc` | `capture_path, renderdoc_path?` | 启动 RenderDoc 并打开截帧，按文件大小动态等待（<50MB→40s, 50-200MB→60s, >200MB→90s） | `{launched, bridgeReady}` |
| 6 | `debug_vulkan_bindings` | `event_id, stage?` | Dump Vulkan descriptor set 原始数据结构，排查纹理绑定问题 | `{descriptorAccess, shaderReflection, ...}` |

**使用场景**：`launch_renderdoc` 是整个工作流的起点。AI 可以自动启动 RenderDoc、加载截帧文件、等待 Bridge 就绪，然后开始分析。

### 类别二：帧信息 & 图形 API（2 个）

| # | 工具 | 功能 | 返回 |
|:-:|------|------|------|
| 7 | `get_frame_summary` | 获取帧概要统计（总 Draw/Dispatch/Marker 数量） | `{totalDraws, totalDispatches, totalMarkers}` |
| 8 | `get_draw_call_details` | 获取指定 DrawCall 的详细信息 | `{eventId, vertexShader, fragmentShader, renderTargets, depthTarget, viewport}` |

### 类别三：绘制调用（2 个）

| # | 工具 | 参数 | 功能 |
|:-:|------|------|------|
| 9 | `get_draw_calls` | `include_children?, marker_filter?, only_actions?, event_id_min?, event_id_max?` | 获取帧内所有绘制调用（支持层级结构、Marker 过滤、事件范围过滤） |
| 10 | `set_event` | `event_id: int` | 将回放定位到指定事件，后续所有查询反映该事件后的状态 |

**关键概念**：`set_event` 相当于在帧时间线上"跳转"。GPU 重放到该事件后暂停，所有后续查询（管线状态、绑定贴图等）反映的都是该时刻的 GPU 状态。

### 类别四：资源检查（4 个）

| # | 工具 | 功能 | 返回 |
|:-:|------|------|------|
| 11 | `get_textures` | 列出所有纹理（尺寸、格式、Mip、数组大小等） | `[{id, name, w, h, fmt, mips, array, size}, ...]` |
| 12 | `get_buffers` | 列出所有缓冲区（大小、名称） | `[{id, name, size}, ...]` |
| 13 | `get_resources` | 列出全部资源（纹理、缓冲区、着色器、管线对象等） | `[{id, name, type}, ...]` |
| 14 | `get_resource_usage` | 追踪某资源在帧内的使用方式 | `[{eventId, usage}, ...]` |

### 类别五：管线状态（1 个）

| # | 工具 | 功能 |
|:-:|------|------|
| 15 | `get_pipeline_state` | 查看当前事件的完整 GPU 管线快照：绑定的着色器 ID、渲染目标列表、深度目标、视口 |

**返回示例**：
```json
{
  "shaders": {
    "vertex": {"shaderId": 21878, "textureCount": 0, "cbufferCount": 3},
    "fragment": {"shaderId": 21879, "textureCount": 2, "cbufferCount": 3}
  },
  "renderTargets": [17568, 29581, 29566, 29560, 29563],
  "depthTarget": 29575
}
```

### 类别六：着色器分析（5 个）

| # | 工具 | 功能 |
|:-:|------|------|
| 16 | `get_shader_info` | 获取指定阶段着色器的反射数据、反汇编、绑定资源 |
| 17 | `reverse_shader` | ⭐ **一站式着色器逆向**：所有格式反编译（HLSL/GLSL + DXBC/SPIR-V/GCN ISA）、嵌入源码、反射数据、CBuffer 实时值、绑定贴图自动角色识别、采样器状态 |
| 18 | `get_shader_source` | 提取着色器原始源码（调试信息或高级语言反编译） |
| 19 | `get_shader_reflection` | 着色器反射信息（输入/输出签名、CBuffer、纹理、采样器） |
| 20 | `disassemble_shader` | 获取指定反汇编目标的代码（如 DXBC、SPIR-V） |
| 21 | `get_all_disassembly_targets` | 列出所有可用的反汇编语言目标 |

**`reverse_shader` 是最核心的分析工具**，一次调用返回 Shader 的全部信息。AI 可以直接从返回的 HLSL/GLSL 代码中理解渲染逻辑，从 CBuffer 值中提取材质参数，从绑定贴图中识别材质组成。

### 类别七：贴图绑定与采样器（3 个）

| # | 工具 | 功能 |
|:-:|------|------|
| 22 | `get_bound_textures` | ⭐ 自动映射着色器纹理槽位→实际绑定的纹理，并**智能推断贴图用途** |
| 23 | `get_bound_samplers` | 获取每个采样器槽位的状态（滤波模式、寻址模式） |
| 24 | `get_cbuffer_contents` | 读取着色器常量缓冲区的实际运行时数值 |

**贴图角色自动识别规则**：

| 识别方式 | 关键词/规则 | 推断角色 |
|---------|-----------|---------|
| 变量名匹配 | `_MainTex`, `diffuse`, `baseColor`, `albedo` | albedo |
| 变量名匹配 | `_BumpMap`, `normalMap`, `_NRM` | normal |
| 变量名匹配 | `_MetallicMap`, `metalness` | metallic |
| 变量名匹配 | `_Roughness`, `smoothness` | roughness |
| 变量名匹配 | `_OcclusionMap`, `ao` | ambient_occlusion |
| 变量名匹配 | `_EmissionMap`, `emissive`, `glow` | emissive |
| 变量名匹配 | `env`, `cubemap`, `skybox`, `reflection` | environment |
| 格式启发式 | BC5 / RG 双通道 | normal |
| 格式启发式 | BC6H / HDR 浮点 | environment |

### 类别八：一键导出（2 个）

| # | 工具 | 功能 |
|:-:|------|------|
| 25 | `export_drawcall` | 一键导出 DrawCall 的全部信息：所有着色器反汇编代码（HLSL+DXBC+SPIR-V）、全部绑定贴图存为 PNG（以槽位和角色命名）、CBuffer 值、管线状态 |
| 26 | `export_to_unity` | ⭐ 一键导出 Unity 可用资源：OBJ + FBX 模型（坐标系已转换）、材质定义 JSON（映射 Standard/URP/HDRP）、C# 编辑器一键导入脚本 |

**`export_to_unity` 输出文件**：

```
output_dir/
├── mesh_name.obj              # OBJ 模型
├── mesh_name.fbx              # FBX 7.4 ASCII（Unity/Unreal/Blender 通用）
├── mesh_name_material.json    # Unity 材质定义（属性映射 Standard/URP/HDRP）
├── mesh_name_UnityImport.cs   # C# 编辑器脚本（一键导入+自动赋材质）
└── mesh_name_unity_export.json # 完整导出摘要
```

### 类别九：智能识别（2 个）

| # | 工具 | 功能 |
|:-:|------|------|
| 27 | `identify_drawcalls` | ⭐ 智能识别每个 DrawCall 的渲染内容：逐 DrawCall 截取 RT 缩略图、Shader 分组（相同 VS+FS = 同材质）、纹理绑定列表、屏幕空间包围盒和覆盖率 |
| 28 | `analyze_lighting` | 灯光分析：检测 PBR/Blinn-Phong 光照模型、提取 CBuffer 灯光参数、识别阴影贴图和环境 CubeMap |

**`identify_drawcalls` 的核心原理**：

```
SetFrameEvent(eid_66) → SaveTexture(RT) → 只有脸（眼眶镂空）→ 头部皮肤
SetFrameEvent(eid_73) → SaveTexture(RT) → 红色虹膜填入       → 眼球 ✅
SetFrameEvent(eid_87) → SaveTexture(RT) → 黑色发丝出现       → 头发
```

### 类别十：纹理操作（3 个）

| # | 工具 | 参数 | 功能 |
|:-:|------|------|------|
| 29 | `pick_pixel` | `resource_id, x, y` | 读取纹理指定像素的 RGBA 值（浮点精度） |
| 30 | `get_texture_minmax` | `resource_id` | 获取纹理的最小/最大像素值（用于判断数据范围） |
| 31 | `save_texture` | `resource_id, output_path, mip?, slice?` | ⭐ 导出纹理到文件。v1.6.0 自动 Y 翻转 + Linear→sRGB gamma 校正 |

**`save_texture` 的 CubeMap 策略**：

| 场景 | 行为 |
|------|------|
| CubeMap + DDS | 6 面合并为单文件 |
| CubeMap + PNG (slice=-1) | 自动拆为 6 个面文件 `_face0_posX.png` ~ `_face5_negZ.png` |
| CubeMap + PNG (slice=N) | 只导出第 N 面 |
| 2D 纹理 | 直接保存单文件 |

### 类别十一：缓冲区数据（1 个）

| # | 工具 | 功能 |
|:-:|------|------|
| 32 | `get_buffer_contents` | 读取缓冲区原始数据（返回 hex + base64 双格式，最大 4096 字节） |

### 类别十二：像素历史（1 个）

| # | 工具 | 功能 |
|:-:|------|------|
| 33 | `pixel_history` | 追踪一个像素在整帧内的完整修改历史——哪些 DrawCall 写了这个像素、写之前和写之后的 RGBA 值 |

**使用场景**：调查"这个像素为什么是这个颜色"——定位到具体是哪个 DrawCall 导致了问题。

### 类别十三：着色器调试（2 个）

| # | 工具 | 功能 |
|:-:|------|------|
| 34 | `debug_pixel` | 逐步跟踪像素着色器执行过程（每步的变量名和值） |
| 35 | `debug_vertex` | 逐步跟踪顶点着色器执行过程 |

### 类别十四：性能分析（2 个）

| # | 工具 | 功能 |
|:-:|------|------|
| 36 | `enumerate_counters` | 列出 GPU 支持的所有性能计数器（计数器 ID、名称、描述、单位） |
| 37 | `fetch_counters` | 获取指定性能计数器在每个 DrawCall 上的值 |

### 类别十五：网格与调试消息（2 个）

| # | 工具 | 功能 |
|:-:|------|------|
| 38 | `get_post_vs_data` | 获取顶点着色器后的网格输出信息（索引数、拓扑、跨步） |
| 39 | `get_debug_messages` | 获取图形驱动的验证错误/警告/信息 |

---

## 三、使用流程

### 3.1 基础分析流程

```
步骤 1: 加载截帧
  → launch_renderdoc("capture.rdc")
  → ping()  确认连接

步骤 2: 了解帧内容
  → get_frame_summary()  获取帧统计
  → get_draw_calls()     查看 DrawCall 列表

步骤 3: 定位目标
  → identify_drawcalls() 智能识别每个 DrawCall 画了什么
  → 或 set_event(142)    手动定位到目标事件

步骤 4: 分析渲染状态
  → get_pipeline_state(142)     查看绑定的 Shader 和 RT
  → reverse_shader(142, "fragment")  逆向像素着色器
  → get_bound_textures(142, "fragment")  查看贴图绑定

步骤 5: 导出资源
  → export_to_unity(142, "output/", "mesh_name")  导出模型
  → save_texture(rid, "output/albedo.png")          导出贴图
```

### 3.2 完整角色逆向流程

```
1. launch_renderdoc("角色截帧.rdc")
   → 自动启动 RenderDoc + 加载截帧

2. identify_drawcalls()
   → 逐 DrawCall 截图
   → 识别出眼球=EID73, 头发=EID87, 身体=EID98...

3. 对每个部件：
   a. export_to_unity(eid, "output/body", "body")
      → 导出 OBJ + FBX + 材质 JSON + C# 导入脚本
   
   b. save_texture(对每个纹理 resourceId)
      → 导出 Albedo/Normal/Roughness/AO 等 PNG
      → 自动 Y 翻转 + sRGB gamma 校正
   
   c. reverse_shader(eid, "fragment")
      → 获取 HLSL/GLSL 源码
      → 提取 CBuffer 材质参数（roughness=0.3, metallic=0.9...）

4. 在 Unity 中使用：
   → 将导出文件夹复制到 Assets/
   → 将 _UnityImport.cs 放入 Assets/Editor/
   → 菜单 RenderDoc > Import → 自动导入+赋材质
```

### 3.3 性能分析流程

```
1. enumerate_counters()
   → 查看 GPU 支持的性能计数器列表

2. fetch_counters("1,2,3")
   → 获取每个 DrawCall 的 GPU 耗时、像素着色器调用次数等

3. get_action_timings()
   → 按 Marker 分组的 GPU 时间分析

4. 定位到耗时最高的 DrawCall：
   → reverse_shader(eid, "fragment")
   → 分析 Shader 复杂度
   → get_bound_textures() 查看纹理分辨率
```

### 3.4 像素调试流程

```
1. pixel_history(rt_id, 400, 300)
   → 查看该像素被哪些 DrawCall 修改过
   → 定位到问题 DrawCall

2. set_event(问题 eid)
   → 定位到该事件

3. debug_pixel(400, 300)
   → 逐步跟踪像素着色器执行
   → 查看每步变量值，定位逻辑错误
```

---

## 四、版本演进

| 版本 | 日期 | 核心更新 |
|------|------|---------|
| v1.0 | 2026-03 | 初始版本：基础 MCP 工具 + 文件 IPC 架构 |
| v1.2 | 2026-03 | Vulkan 纹理 resourceId 解析修复 |
| v1.3 | 2026-04 | 模型导出改用 VBuffer 直读 + FBX 7.4 支持 + CubeMap 拆面 |
| v1.5 | 2026-04 | 模型导出质量修复：坐标系转换、baseVertex、索引重映射、压缩法线检测（6 个 bug） |
| v1.6 | 2026-04 | 贴图导出质量修复：Y 翻转 + Linear→sRGB gamma 校正（2 个 bug） |

---

## 五、踩坑经验

### 5.1 Python 版本鸿沟
RenderDoc 内置 Python 3.6，MCP 需要 3.10+。文件 IPC 桥接是最简单可靠的方案。

### 5.2 SWIG 对象陷阱
pyrenderdoc 的 SWIG 绑定中，`int()` 可能返回 C++ 指针地址（~3 万亿），不是逻辑值。

### 5.3 API 参数不一致
同一个函数在不同 RenderDoc 版本中参数个数不同，全靠 `try/except` 适配。

### 5.4 Vulkan/ANGLE 特殊性
纹理匿名、Descriptor Set 结构不同、CBuffer 变量名被混淆为 `_childN`。

### 5.5 坐标系转换
DX 左手→右手：位置 X 取负 + 缠绕反转，所有格式必须同步。

### 5.6 压缩法线
NORMAL 语义可能存储 packed tangent frame（uint32），必须在归一化前检测。

### 5.7 SaveTexture Linear 输出
RenderDoc 解压 sRGB 压缩格式时输出 Linear 值，需后处理 gamma 校正。

### 5.8 纹理 Y 方向
DX11 纹理 top-down 存储，导出后需 Y 翻转。后处理放在 MCP Server 端（有 Pillow/numpy）。

---

## 六、项目数据

| 指标 | 数值 |
|------|------|
| MCP 工具总数 | **37 个** |
| 代码行数 | Bridge 端 ~3400 行 + Server 端 ~720 行 |
| 支持的图形 API | D3D11, D3D12, Vulkan, OpenGL |
| 导出格式 | OBJ, FBX, PNG, JPG, BMP, TGA, HDR, EXR, DDS |
| 贴图角色自动识别 | 14 种（albedo, normal, metallic, roughness, ao, emissive...） |
| Unity 材质映射 | Standard / URP / HDRP 三管线覆盖 |
| 贴图导出精度 | ±1/255 逐像素匹配（v1.6.0） |
| 完整角色分析耗时 | < 5 分钟（手动 2+ 小时） |
| 效率提升 | **10 倍以上** |

---

*RenderDoc MCP v1.6.0 | 37 个 MCP 工具 | MIT License*
