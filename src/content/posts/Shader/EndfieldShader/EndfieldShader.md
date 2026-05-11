---
title: 终末地渲染Shader流程
published: 2026-05-11
description: '终末地角色渲染方案-unity'
image: './image-0.png'
tags: [测试,Arknights:Endfield,Shader,游戏角色]
category: '游戏角色Shader还原'
draft: false
lang: 'zh_CN'
pinned: false
---

:::tip
该文章目前已经更新完成，主要是unity中的实现方案，注意不是100%逆向，大部分是自己的理解，有问题可以在评论区留言或者通过联系方式联系我
:::

:::warning
下面视频是第一版的ZMDShader效果，目前已经迭代新版在作品集中后面会同步到b站上，这一版可以先参考一下
:::
<iframe width="100%" height="468" src="//player.bilibili.com/player.html?bvid=BV1RVRJB2E42&p=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>

本文档用于重新梳理当前终末地渲染还原工程中的角色渲染方案，并给出一套可复用的制作流程。内容覆盖两大部分：

- `Assets/Script` 下的 URP Renderer Feature、全局控制器与辅助脚本方案。
- `Assets/Animator/Shader` 下的角色 Shader 方案。

目标效果是制作一套适用于 URP 的二次元 / NPR 角色渲染系统，包含逐物体屏幕空间阴影、角色自阴影、环境投影阴影、全局边缘光、可控 URP 附加光、外描边、脸部 SDF 阴影、头发各向异性高光、眼睛 MatCap、服装 NPR + 类 PBR 高光、Shell 毛发等效果。

---

## 1. 终末地渲染还原工程方案总览

当前终末地渲染还原工程的角色渲染可以理解为三层结构：

```mermaid
flowchart TD
    A[资产准备层] --> A1[模型 / 骨骼 / UV / 顶点色]
    A --> A2[贴图通道规划]
    A --> A3[UV2 平滑法线写入]

    B[Script 插件层] --> B1[PerObjectShadow 逐物体阴影]
    B --> B2[Depth Offset Rim 后处理边缘光]
    B --> B3[Fur Shell 毛发 RendererFeature]
    B --> B4[GlobalEnvLightController 全局阴影 / 边缘光 / 附加光]
    B --> B5[FaceDirection 头部方向参数]
    B --> B6[SmoothNormals 平滑法线工具]

    C[Char Shader 层] --> C1[S_Char_Body 皮肤]
    C --> C2[S_Char_Face 脸部]
    C --> C3[S_Char_Hair 头发]
    C --> C4[S_Char_Cloth 服装]
    C --> C5[S_Char_Eye 眼睛 / 眉毛]
    C --> C6[S_Char_Fur Shell 毛发]
    C --> C7[S_Char_Shadow 特殊透明阴影]
    C --> C8[S_Char_Utils 公共函数库]
    C --> C9[ScreenSpaceShadowReceiver 环境接收阴影]

    A --> B --> C
```

整体渲染目标：

- **角色自身**：使用 `Animator/Shader` 下的材质进行 NPR 着色，并支持 URP 主光与受控附加光。
- **角色阴影**：由 `PerObjectShadow` 插件生成屏幕空间逐物体阴影，再由角色 Shader 采样。
- **阴影强度**：通过 `SChar_ApplyShadowStrength` 支持 `0~1` 线性减弱和 `1~3` 指数压暗。
- **环境投影**：逐物体阴影可投射到环境接收材质 `PerObjectShadow/ScreenSpaceShadowReceiver` 上，并由 `_Global_EnvShadowStrength` 控制强度。
- **角色描边**：通过 `S_Char_Common.hlsl` 的反面膨胀描边实现。
- **边缘光**：一套在角色材质内部计算，另一套是全屏后处理版本。
- **头发 / 眼睛 / 脸部**：使用专用 Shader 处理透明、遮挡、SDF 阴影和高光。
- **毛发**：使用 RendererFeature 多次绘制 Shell 层。

---

## 2. `Assets/Script` 下的插件方案与效果

当前 `Assets/Script` 下真正作为 URP Renderer Feature 使用的插件主要有三套：

| 插件       | 文件                                                           | 主要效果                          |
| -------- | ------------------------------------------------------------ | ----------------------------- |
| 逐物体阴影    | `Assets/Script/PerObjectShadow/C#/PerObjectShadowFeature.cs` | 角色自阴影、环境投影阴影、屏幕空间阴影贴图、透明深度预写入 |
| 深度偏移边缘光  | `Assets/Script/Depth Offset Rim/DepthOffsetRimFeature.cs`    | 后处理式角色轮廓边缘光                   |
| Shell 毛发 | `Assets/Script/Fur/FurFeature.cs`                            | 多层 Shell 毛发体积                 |

此外还有若干辅助脚本：

| 脚本                                                         | 作用                                                                    |
| ---------------------------------------------------------- | --------------------------------------------------------------------- |
| `GlobalEvnLightController.cs` / `GlobalEnvLightController` | 设置角色全局边缘光、自阴影强度、环境阴影强度，并统一控制 URP 附加光在角色 Shader 中的颜色、强度、范围、Spot 角和阴影影响 |
| `FaceDirection.cs`                                         | 设置头部前 / 右 / 上方向，供脸部、头发和眼睛 Shader 使用                                   |
| `SmoothNormals.cs`                                         | 将平滑法线烘焙到模型 `UV2`，供描边使用                                                |
| `VertexNormalViewer.cs`                                    | 在 Scene 视图中显示法线、切线、副切线，便于检查模型数据                                       |
| `FurInertia.cs`                                            | 给 Shell 毛发传递惯性偏移，让毛发随运动甩动                                             |
| `DemoAnimController.cs`                                    | Demo 动画切换与 Root Motion 辅助                                             |
| `LightRotater.cs`                                          | Demo 场景灯光旋转辅助                                                         |
| `MouseOrbit.cs`                                            | Demo 场景相机环绕辅助                                                         |

`Assets/Script/ScreenSpacePlanarReflection` 当前目录为空，未发现实际反射插件实现。

---

## 3. 逐物体屏幕空间阴影插件 `PerObjectShadow`

### 3.1 效果定位

`PerObjectShadow` 是当前终末地渲染还原工程中最核心的角色阴影插件。它解决的问题是：

- 普通 URP ShadowMap 对角色局部自阴影精度不够。
- 多角色需要各自独立的高质量阴影。
- 角色阴影既要能投在自身，也要能投到环境。
- 角色自阴影需要可控、柔和、支持彩色 Ramp。
- 自阴影需要通过 Stencil 限制，避免角色 A 的自阴影影响角色 B。

最终输出是一张屏幕空间彩色阴影图：

```hlsl
_PerObjectScreenSpaceShadowMap
```

角色 Shader 通过屏幕坐标采样这张贴图：

```hlsl
half3 screenShadow = saturate(SamplePerObjectScreenSpaceShadowmap(i.perObjectShadowCoord));
```

然后将阴影混入皮肤、头发、衣服等材质的最终颜色。

---

### 3.2 插件文件结构

```text
Assets/Script/PerObjectShadow
├── C#
│   ├── PerObjectShadowFeature.cs
│   ├── PerObjectShadowPass.cs
│   ├── PerObjectScreenSpaceShadowsPass.cs
│   ├── PerObjectShadowProjector.cs
│   ├── PerObjectShadowUtils.cs
│   └── PerObjectTransparentDepthPass.cs
└── HLSL
    ├── PerObjectShadowCaster.shader
    └── PerObjectShadowVolumeInclude.hlsl
```

每个文件职责如下：

| 文件                                   | 职责                                             |
| ------------------------------------ | ---------------------------------------------- |
| `PerObjectShadowFeature.cs`          | Renderer Feature 入口，创建并调度所有 Pass               |
| `PerObjectShadowPass.cs`             | 第一阶段：为每个对象生成 ShadowMap Atlas                   |
| `PerObjectScreenSpaceShadowsPass.cs` | 第二阶段：用体积盒将 ShadowMap 投影到屏幕空间                   |
| `PerObjectShadowProjector.cs`        | 挂在角色上，收集 Renderer、包围盒、Stencil ID               |
| `PerObjectShadowUtils.cs`            | 矩阵、Atlas、Bias、剔除、绘制工具函数                        |
| `PerObjectTransparentDepthPass.cs`   | 半透明对象深度预写入，例如头发深度                              |
| `PerObjectShadowCaster.shader`       | Hidden Shader，包含 ShadowCaster 和 Volume 投影 Pass |
| `PerObjectShadowVolumeInclude.hlsl`  | 屏幕空间重建、PCF、Ramp、体积裁剪逻辑                         |

---

### 3.3 渲染流程

整个插件分为两个核心阶段，外加一个透明深度辅助阶段。

```mermaid
sequenceDiagram
    participant Feature as PerObjectShadowFeature
    participant Projector as PerObjectShadowProjector
    participant ShadowPass as PerObjectShadowPass
    participant ScreenPass as PerObjectScreenSpaceShadowsPass
    participant Shader as Char Shader

    Feature->>Projector: 收集 activeProjectors
    Feature->>ShadowPass: Setup 主光 / 相机 / 虚拟光
    ShadowPass->>ShadowPass: 剔除对象 / 计算包围盒
    ShadowPass->>ShadowPass: 分配 ShadowMap Atlas
    ShadowPass->>ShadowPass: 逐对象渲染 ShadowCaster 到 Tile
    Feature->>ScreenPass: 传入 ShadowMap 与 SliceData
    ScreenPass->>ScreenPass: 绘制体积盒
    ScreenPass->>ScreenPass: 重建世界坐标并采样 ShadowMap
    ScreenPass->>Shader: 输出 _PerObjectScreenSpaceShadowMap
    Shader->>Shader: 采样屏幕空间阴影并混合到角色材质
```

---

### 3.4 第一阶段：生成逐物体 ShadowMap Atlas

核心文件：

```text
Assets/Script/PerObjectShadow/C#/PerObjectShadowPass.cs
```

`PerObjectShadowPass` 的主要工作：

1. 遍历所有激活的 `PerObjectShadowProjector.activeProjectors`。
2. 对每个角色做距离剔除和视锥剔除。
3. 根据有效角色数量动态计算 ShadowMap Atlas 大小。
4. 为每个角色分配一个 Tile。
5. 根据角色包围盒和光源方向计算正交阴影相机矩阵。
6. 使用 Hidden Shader 的 `ShadowCaster` Pass 把角色绘制到 Atlas 中。

关键数据结构：

```csharp
public struct PerObjectShadowSliceData
{
    public Matrix4x4 viewMatrix;
    public Matrix4x4 projectionMatrix;
    public Matrix4x4 shadowTransform;
    public Matrix4x4 shadowToWorldMatrix;
    public int offsetX, offsetY;
    public int resolution;
    public Vector4 uvScaleOffset;
}
```

这个结构记录了一个角色对应的 ShadowMap Tile 的完整信息。

#### Atlas 动态布局

工具函数位于：

```text
Assets/Script/PerObjectShadow/C#/PerObjectShadowUtils.cs
```

核心逻辑：

- 1 个对象：使用基础分辨率。
- 2 个对象：高度减半，形成更紧凑的布局。
- 5 到 8 个对象：横向扩展 Atlas。
- 17 到 32 个对象：继续横向扩展。

Tile 分辨率会根据对象数量自动降低，以保证 Atlas 能容纳所有角色。

#### Texel Snapping

`ComputePerObjectShadowMatrices` 中会对投影范围做像素对齐：

```csharp
minX = Mathf.Floor(minX / worldTexelSizeX) * worldTexelSizeX;
minY = Mathf.Floor(minY / worldTexelSizeY) * worldTexelSizeY;
```

作用：

- 防止相机移动时阴影边缘抖动。
- 让阴影投影窗口以 ShadowMap texel 为单位跳动。
- 提高近景角色自阴影稳定性。

---

### 3.5 第二阶段：体积盒屏幕空间投影

核心文件：

```text
Assets/Script/PerObjectShadow/C#/PerObjectScreenSpaceShadowsPass.cs
Assets/Script/PerObjectShadow/HLSL/PerObjectShadowVolumeInclude.hlsl
```

`PerObjectScreenSpaceShadowsPass` 会创建屏幕大小的 RT：

```hlsl
_PerObjectScreenSpaceShadowMap
```

然后为每个角色绘制一个体积盒。

体积盒不是画真实模型，而是画该角色阴影空间对应的单位立方体。片元阶段通过相机深度重建世界坐标，再判断当前屏幕像素是否处于该角色阴影体积内。

核心片元流程：

```hlsl
float sceneDepth = SampleSceneDepth(screenUV);
float3 worldPos = ComputeWorldSpacePosition(screenUV, depth, UNITY_MATRIX_I_VP);
float4 positionSHCS = mul(_VolumeWorldToShadowClip, float4(worldPos, 1.0));
positionSHCS.xyz /= positionSHCS.w;
clip(1.001 - abs(positionSHCS.xyz));
float4 shadowCoord = mul(_VolumeWorldToShadow, float4(worldPos, 1.0));
```

这一步完成了：

- 从屏幕像素和深度图还原世界坐标。
- 将世界坐标投影进当前角色的阴影空间。
- 如果不在阴影盒中，直接裁剪。
- 如果在阴影盒中，采样该角色 ShadowMap Tile。

---

### 3.6 环境阴影与自阴影的区别

`PerObjectShadowFeature` 中有两组配置：

```csharp
EnvironmentShadowSettings environmentShadow;
SelfShadowSettings selfShadow;
```

#### 环境阴影

环境阴影使用真实主方向光方向：

```csharp
Quaternion mainLightRotation = m_MainLight.transform.rotation;
```

用途：

- 角色投射到地面、墙面、场景物体。
- 可作为角色外部投影阴影。

特点：

- 方向与主光一致。
- 可使用较高分辨率，例如 `2048`。
- 可开启 Ramp 让阴影有彩色渐变。

#### 自阴影

自阴影使用虚拟光源方向，默认跟随主相机：

```csharp
Vector3 cameraEuler = renderingData.cameraData.camera.transform.eulerAngles;
pitch = Mathf.Clamp(pitch, selfShadow.minPitch, selfShadow.maxPitch);
virtualLightRotation = Quaternion.Euler(pitch, cameraEuler.y, cameraEuler.z);
```

用途：

- 角色身上稳定、好看的面部 / 身体局部阴影。
- 规避真实主光在镜头变化时带来的不好看的自遮挡。

特点：

- 可以限制 Pitch 范围。
- 可跟随相机，提高近景精度。
- 通过 Stencil 限制到当前角色自身。

---

### 3.7 Stencil 隔离方案

每个角色挂载 `PerObjectShadowProjector` 后，会自动分配一个 `stencilRef`：

```csharp
private static int s_NextStencilRef = 2;
private int m_StencilRef = 0;
```

角色 Shader 的主 Pass 和深度 Pass 都会写入：

```hlsl
Stencil
{
    Ref [_StencilRef]
    Comp Always
    Pass Replace
}
```

自阴影体积 Pass 使用：

```hlsl
Stencil
{
    Ref [_StencilRef]
    Comp Equal
    Pass Keep
}
```

这样可以保证：

- 角色 A 的自阴影只画到角色 A 身上。
- 角色 B 不会收到角色 A 的自阴影。
- 环境阴影可以使用不同的 Stencil 策略。

注意：Stencil 状态不能通过 `MaterialPropertyBlock` 修改，所以 `PerObjectShadowProjector` 会在运行时克隆材质并写入 `_StencilRef`。

---

### 3.8 PCF 与彩色 Shadow Ramp

`PerObjectShadowVolumeInclude.hlsl` 支持三档 PCF：

| 关键字           | 采样核      | Fetch 数量 | 效果        |
| ------------- | --------:| --------:| --------- |
| `_PCF_LOW`    | 3x3 Tent | 4        | 性能最好，柔化较弱 |
| `_PCF_MEDIUM` | 5x5 Tent | 9        | 默认推荐      |
| `_PCF_HIGH`   | 7x7 Tent | 16       | 最柔和，性能最高  |

#### 自阴影方案对比：泊松圆盘 + PCF Filter vs Stencil 隔离 + PCF Fetch

| 方案 | 核心思路 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 泊松圆盘 + PCF Filter | 围绕 Shadow Coord 按泊松圆盘偏移多次采样 ShadowMap，再把多次比较结果平均成软阴影。 | 实现直观；采样分布不规则，边缘比固定网格更自然；不依赖 Stencil，适合单角色或简单投影场景快速验证。 | 多角色时缺少接收对象隔离，角色 A 的自阴影容易影响角色 B；采样半径、Bias、随机旋转不好调，近景容易出现抖动、噪点或游泳感；采样数量越高性能越贵；在 Atlas Tile 边缘容易跨 Tile 采样产生污染。 |
| Stencil 隔离 + PCF Fetch | 角色主 Pass / 深度 Pass 写入唯一 `_StencilRef`，自阴影体积 Pass 只在 `Comp Equal` 的区域写入；PCF 使用 Unity Tent Filter 的优化 Fetch 数量生成 3x3 / 5x5 / 7x7 软阴影。 | 自阴影严格限制在当前角色身上，多角色不会互相串影；Fetch 数量固定且可控，`3x3=4`、`5x5=9`、`7x7=16`；更适合二次元角色近景，稳定性和可调试性更好；可以和 Shadow Ramp、全局自阴影强度直接组合。 | 需要所有相关角色材质正确写入 Stencil，透明头发、脸、衣服等 Pass 要保持一致；Stencil 状态不能通过 `MaterialPropertyBlock` 修改，需要运行时克隆材质写 `_StencilRef`；会占用 Stencil 位，角色数量和其他 Stencil 用法需要规划；隔离解决的是“画到谁身上”，阴影锯齿仍然需要依赖分辨率、Bias 和 PCF 档位调节。 |

当前终末地渲染还原工程的自阴影默认推荐使用 `Stencil 隔离 + PCF Fetch`。它比单纯的 `泊松圆盘 + PCF Filter` 更适合多角色、近景角色和需要稳定 NPR 阴影边界的场景；泊松圆盘方案更适合作为不需要角色隔离时的实验性软阴影方案。

Ramp 逻辑：

```hlsl
half3 shadowColor = SampleShadowRamp(shadow);
shadowColor = lerp(shadow.xxx, shadowColor, _PerObjectShadowParams.y);
```

这意味着可以把黑白阴影衰减值映射成彩色阴影，适合二次元角色的暖色 / 冷色暗部。

---

### 3.9 半透明深度预写入

核心文件：

```text
Assets/Script/PerObjectShadow/C#/PerObjectTransparentDepthPass.cs
```

它会渲染所有拥有 LightMode：

```hlsl
TransparentDepthPrepass
```

的透明物体，并输出：

```hlsl
_PerObjectTransparentDepthTexture
```

用途：

- 让透明头发也能参与深度边缘光。
- 让眼睛 Shader 判断是否被头发遮挡。
- 让屏幕空间阴影体积重建时可以使用透明深度。

例如头发 Shader 中有：

```hlsl
Tags { "LightMode" = "TransparentDepthPrepass" }
```

眼睛 Shader 会采样：

```hlsl
_PerObjectTransparentDepthTexture
```

根据头发深度对眼睛进行遮挡染色和透明度衰减。

---

### 3.10 `PerObjectShadow` 制作步骤

#### 步骤 1：在 URP Renderer 中添加 Feature

打开当前使用的 URP Renderer Asset，添加：

```text
Per Object Shadow
```

建议初始参数：

| 参数                          | 推荐值                                            | 说明                |
| --------------------------- | ----------------------------------------------:| ----------------- |
| `Max Shadow Objects`        | 16                                             | 同屏角色不多时够用         |
| `Draw Distance`             | 50 ~ 100                                       | 根据镜头远近调整          |
| `Use Collider Bounds`       | 开启                                             | 角色有 Collider 时更稳定 |
| `Shadow Caster Pass Timing` | `BeforeRenderingShadows`                       | 默认即可              |
| `Screen Space Pass Timing`  | `AfterOpaques` 或 `BeforeRenderingTransparents` | 若和 SSAO 冲突，改为透明前  |

#### 步骤 2：配置环境阴影

推荐初始参数：

| 参数                     | 推荐值        |
| ---------------------- | ----------:|
| `Enabled`              | 开启         |
| `ShadowMap Resolution` | 2048       |
| `Shadow Type`          | Soft       |
| `PCF Quality`          | Medium 5x5 |
| `Depth Bias`           | 1          |
| `Normal Bias`          | 1          |
| `Far Plane Scale`      | 3 ~ 5      |

如果阴影断裂，适当增加 `Far Plane Scale`。  
如果阴影漂浮，降低 `Normal Bias`。  
如果阴影粉刺，增加 `Depth Bias`。

#### 步骤 3：配置自阴影

推荐初始参数：

| 参数                              | 推荐值        |
| ------------------------------- | ----------:|
| `Enabled`                       | 开启         |
| `ShadowMap Resolution`          | 1024       |
| `Shadow Type`                   | Soft       |
| `PCF Quality`                   | Medium 5x5 |
| `Min Pitch`                     | 30         |
| `Max Pitch`                     | 35         |
| `Far Plane Scale`               | 0.5 ~ 1    |
| `Follow Camera`                 | 开启         |
| `Follow Camera OrthoSize Scale` | 0.8 ~ 1.2  |

自阴影是角色观感的核心，推荐优先调它。

#### 步骤 4：给角色添加 `PerObjectShadowProjector`

在角色根节点添加组件：

```text
Rendering/PerObjectShadow Projector
```

然后：

1. 点击或调用 `CollectRenderers` 收集子 Renderer。
2. 如角色材质需要 Stencil 隔离，设置 `Stencil Renderer Root`。
3. 如果没有自定义阴影材质，默认会使用 `Hidden/PerObjectShadowCaster`。
4. 确认角色 Shader 中有 `_StencilRef` 属性。

#### 步骤 5：角色材质采样屏幕阴影

角色 Shader 需要：

```hlsl
float4 perObjectShadowCoord : TEXCOORD;
```

顶点阶段：

```hlsl
o.perObjectShadowCoord = ComputeScreenPos(vertexInput.positionCS);
```

片元阶段：

```hlsl
half3 screenShadow = saturate(SamplePerObjectScreenSpaceShadowmap(i.perObjectShadowCoord));
```

最终混合：

```hlsl
half finalShadowStrength = _Global_ShadowStrength * _ShadowStrength;
half3 coloredShadow = lerp(_ShadowColor.rgb, half3(1,1,1), screenShadow.x);
half3 perObjectShadow = SChar_ApplyShadowStrength(screenShadow, finalShadowStrength) * coloredShadow;
```

`SChar_ApplyShadowStrength` 会让 `0~1` 保持线性减弱，超过 `1` 后继续指数压暗，因此当前材质和全局控制器都允许把自阴影调得比原始屏幕阴影更重。

---

### 3.11 环境接收 Shader `PerObjectShadow/ScreenSpaceShadowReceiver`

文件：

```text
Assets/Env/Shader/PerObjectScreenSpaceShadowReceiver.shader
```

Shader 名称：

```text
PerObjectShadow/ScreenSpaceShadowReceiver
```

它用于让地面、墙面或其它环境物体接收角色逐物体屏幕空间阴影。和角色材质不同，它不是计算角色自身 NPR 光照，而是把环境基础色、主光、Unity 阴影、SSAO 和 `_PerObjectScreenSpaceShadowMap` 混合在一起。

主要属性：

| 属性            | 作用                                  |
| ------------- | ----------------------------------- |
| `_MaskMap`    | R 通道用于在 `_Color1` 和 `_Color2` 之间插值  |
| `_Color1`     | Mask 为黑时的环境颜色                       |
| `_Color2`     | Mask 为白时的环境颜色                       |
| `_StencilRef` | 隐藏属性，当前环境接收 Pass 固定按 Stencil `0` 过滤 |

核心片元逻辑：

```hlsl
half unityShadow = lerp(half3(1.0, 1.0, 1.0), mainLight.shadowAttenuation, _Global_EnvShadowStrength);
half3 screenShadow = saturate(SamplePerObjectScreenSpaceShadowmap(input.shadowCoord));
screenShadow = lerp(half3(1.0, 1.0, 1.0), screenShadow, _Global_EnvShadowStrength);
half3 shadowAtten = min(screenShadow, unityShadow.xxx);
```

它的特点：

- `_Global_EnvShadowStrength` 由 `GlobalEnvLightController.envShadowStrength` 写入。
- 自定义屏幕空间阴影和 Unity 主光阴影会取更暗结果。
- 会乘上 SSAO 的 `directAmbientOcclusion`，让环境接触暗部更稳定。
- Forward 和 DepthOnly Pass 都使用 `Stencil Ref 0 Comp Equal`，避免环境阴影画到角色自身写过 Stencil 的区域。

制作步骤：

1. 给需要接收角色阴影的环境物体创建材质。
2. Shader 选择 `PerObjectShadow/ScreenSpaceShadowReceiver`。
3. 设置 `_Color1` / `_Color2` 和 `_MaskMap`。
4. 保证 `PerObjectShadowFeature` 已输出 `_PerObjectScreenSpaceShadowMap`。
5. 在 `GlobalEnvLightController` 中调节 `envShadowStrength`。

---

## 4. 深度偏移边缘光插件 `DepthOffsetRim`

### 4.1 效果定位

`DepthOffsetRimFeature` 是一个后处理式边缘光插件。它的效果是：

- 只对指定 Layer 的角色生效。
- 根据深度差检测角色边缘。
- 将边缘光叠加到相机颜色缓冲上。
- 属于全屏后处理，不写在角色材质内部。

文件：

```text
Assets/Script/Depth Offset Rim/DepthOffsetRimFeature.cs
Assets/Script/Depth Offset Rim/DepthOffsetRim_PP.shader
```

---

### 4.2 渲染流程

```mermaid
flowchart TD
    A[筛选 Character Layer] --> B[用 Unlit 材质绘制角色 Mask]
    B --> C[得到 _CharacterMaskTexture]
    C --> D[全屏后处理]
    D --> E[采样中心深度]
    D --> F[采样上下左右偏移深度]
    E --> G[计算最大深度差]
    F --> G
    G --> H[smoothstep 得到 Rim Mask]
    H --> I[Blend One One 加法叠加边缘光]
```

Shader 核心：

```hlsl
float depthL = LinearEyeDepth(SampleSceneDepth(uv - offsetX), _ZBufferParams);
float depthR = LinearEyeDepth(SampleSceneDepth(uv + offsetX), _ZBufferParams);
float depthU = LinearEyeDepth(SampleSceneDepth(uv + offsetY), _ZBufferParams);
float depthD = LinearEyeDepth(SampleSceneDepth(uv - offsetY), _ZBufferParams);
float maxDiff = max(max(depthL - centerDepth, depthR - centerDepth), max(depthU - centerDepth, depthD - centerDepth));
float DOR_mask = smoothstep(_Threshold - _Smooth, _Threshold + _Smooth, maxDiff);
```

---

### 4.3 与材质内边缘光的区别

当前终末地渲染还原工程其实有两套边缘光：

| 类型     | 实现位置                                                 | 特点                               |
| ------ | ---------------------------------------------------- | -------------------------------- |
| 后处理边缘光 | `DepthOffsetRimFeature` + `DepthOffsetRim_PP.shader` | 全屏统一处理，依赖角色 Mask，适合整体轮廓光         |
| 材质内边缘光 | `S_Char_Common.hlsl` 的 `CalculateAnimeRimLight`       | 每个角色 Shader 内计算，可结合阴影、基础色、对象空间遮罩 |

后处理边缘光适合快速统一风格；材质内边缘光更细致，可针对皮肤、头发、衣服分别控制。

---

### 4.4 制作步骤

#### 步骤 1：添加 Renderer Feature

在 URP Renderer Asset 中添加：

```text
DepthOffsetRimFeature
```

#### 步骤 2：指定 Shader

将 Shader 设置为：

```text
Hidden/PostProcessing/DepthOffsetRim_PP
```

#### 步骤 3：设置角色 Layer

将角色放到单独 Layer，例如：

```text
Character
```

然后在 Feature 的 `Character Layer Mask` 中只勾选该 Layer。

#### 步骤 4：调节参数

| 参数              | 作用       | 建议           |
| --------------- | -------- | ------------ |
| `Offset Mul`    | 深度采样偏移距离 | 0.005 ~ 0.02 |
| `Threshold`     | 深度差阈值    | 0.05 ~ 0.15  |
| `Smooth`        | 软化范围     | 0.02 ~ 0.08  |
| `Rim Color`     | 边缘光颜色    | 根据主光色调设置     |
| `Rim Intensity` | 强度       | 0.5 ~ 2      |

---

## 5. Shell 毛发插件 `FurFeature`

### 5.1 效果定位

`FurFeature` 使用 Shell 渲染技术模拟短毛、兽耳、尾巴、绒毛等效果。

核心思想：

- 同一个网格重复绘制多次。
- 每次绘制时传入不同的高度参数。
- Shader 沿毛发生长方向把顶点往外推。
- 每层通过噪声和 Mask 裁剪，形成毛发体积。

文件：

```text
Assets/Script/Fur/FurFeature.cs
Assets/Script/Fur/FurInertia.cs
Assets/Animator/Shader/S_Char_Fur.shader
```

---

### 5.2 `FurFeature` 渲染流程

`FurFeature` 会筛选 LightMode 为：

```hlsl
FurShell
```

的 Pass。

每帧循环绘制 `step` 次：

```csharp
for (int i = 0; i < step; i++)
{
    cmd.SetGlobalFloat("_Fur_Height01_GLB", i / (step - 1.0f));
    context.DrawRenderers(...);
}
```

Shader 使用：

```hlsl
float _Fur_Height01_GLB;
float _FurTotalLayers_GLB;
```

来知道当前是第几层。

---

### 5.3 `S_Char_Fur.shader` 核心效果

Shader 名称：

```text
ZMD/Fur_RendererFeature
```

它包含：

- Shell 层顶点外推。
- 毛发生长方向贴图。
- 噪声透明裁剪。
- 距离 LOD。
- 重力弯曲。
- 风力弯曲。
- Flowmap 风向扰动。
- 运动惯性偏移。
- 受控附加光毛发漫反射。
- AO、Fresnel、SSS。

顶点阶段主要计算毛发方向：

```hlsl
half3 growDir = normalize(lerp(o.normalWS, furDirWS, _FurDirInt));
half3 gravityForce = _GravityDir.xyz * forceFactor * _GravityDir.w;
half3 windForce = baseWindForce + flowmapWindForce;
half3 inertiaForce = _FurInertiaOffset * forceFactor * _FurInertiaIntensity;
half3 furDir = normalize(growDir + gravityForce + windForce + inertiaForce);
positionWS += furDir * effectiveHeight * _Thick;
```

片元阶段通过高度、Mask 和 Noise 裁剪：

```hlsl
half maxHeight = pow(height, _ConePow) * Noise;
half coneMask = step(effectiveHeight, maxHeight);
half opacity = coneMask * heightOpacityAtten;
clip(opacity - 0.001h);
```

---

### 5.4 `FurInertia` 惯性方案

`FurInertia.cs` 挂在带毛发 Renderer 的对象上。

它支持两种运动源：

| 模式          | 说明                    |
| ----------- | --------------------- |
| `Transform` | 根据对象整体 Transform 计算惯性 |
| `Bones`     | 根据骨骼中心计算惯性，更适合绑定角色动画  |

它会计算：

- 线速度。
- 角速度。
- 旋转惯性。
- 移动惯性。
- 平滑阻尼后的延迟偏移。

然后通过 `MaterialPropertyBlock` 传入：

```hlsl
_FurInertiaOffset
_FurInertiaIntensity
```

---

### 5.5 Shell 毛发制作步骤

#### 步骤 1：添加 `FurFeature`

在 URP Renderer Asset 中添加：

```text
FurFeature
```

推荐初始参数：

| 参数           | 推荐值                    |
| ------------ | ----------------------:|
| `Pass Event` | `AfterRenderingSkybox` |
| `Queue`      | `Transparent`          |
| `Step`       | 20 ~ 40                |

`Step` 越高，毛发越密，但性能消耗也越高。

#### 步骤 2：创建毛发材质

Shader 选择：

```text
ZMD/Fur_RendererFeature
```

贴图准备：

| 贴图         | 通道          | 用途           |
| ---------- | ----------- | ------------ |
| `_MainTex` | RGB         | 基础颜色         |
| `_FurMask` | RGB         | 毛发法线         |
| `_FurMask` | A           | 毛发高度 / 密度    |
| `_FurDir`  | RG          | 毛发生长方向       |
| `_FurDir`  | BA          | Flowmap 风力方向 |
| `_Noise`   | R           | 透明噪声         |
| `_Shift`   | 当前未明显参与核心计算 | 可保留扩展        |

#### 步骤 3：调节形状参数

| 参数             | 作用        |
| -------------- | --------- |
| `_Thick`       | 毛发整体厚度    |
| `_ConePow`     | 毛尖收束程度    |
| `_FurMaxLayer` | 材质允许的最大层数 |
| `_OpacityPow`  | 随高度衰减透明度  |

推荐先只调 `_Thick` 和 `_FurMaxLayer`，确认轮廓后再调裁剪。

#### 步骤 4：添加 `FurInertia`

在毛发对象上添加：

```text
FurInertia
```

如果是角色骨骼毛发：

1. `Motion Source` 选择 `Bones`。
2. 右键组件菜单选择 `检测Fur骨骼并保存`。
3. 调节 `Follow Speed`、`Damping`、`Movement Influence`。

推荐初始值：

| 参数                   | 推荐值 |
| -------------------- | ---:|
| `Follow Speed`       | 5   |
| `Damping`            | 0.5 |
| `Rotation Influence` | 1   |
| `Movement Influence` | 1   |
| `Inertia Intensity`  | 1   |

---

## 6. 全局辅助脚本方案

### 6.1 `GlobalEnvLightController`

文件：

```text
Assets/Script/GlobalEvnLightController.cs
```

类名：

```csharp
GlobalEnvLightController
```

这个脚本是当前角色渲染系统的全局控制入口，会在 `OnEnable`、`OnValidate` 和 `Update` 中持续写入全局 Shader 参数。它不只负责边缘光，还同时负责：

- 角色材质内边缘光开关和参数。
- 角色自阴影整体强度。
- 环境接收阴影整体强度。
- URP Additional Lights 在角色 Shader 中的统一开关、默认强度和单灯覆盖参数。

#### 全局阴影与边缘光参数

主要全局变量：

```hlsl
_Global_EnableRimLight
_Global_ShadowStrength
_Global_EnvShadowStrength
_Global_OffsetMul
_Global_Threshold
_Global_Smooth
_Global_RimLightColor
_Global_RimIntensity
_Global_RimLightBrightness
_Global_InnerRimColor
_Global_InnerRimPower
_Global_InnerRimIntensity
_Global_InnerRimBrightness
_Global_InnerRimBias
_Global_RimLightDirection
_Global_RimLightSoftness
_Global_RimLightOffset
```

对应作用：

| 参数                                                                                                                                      | 作用                               |
| --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `_Global_EnableRimLight`                                                                                                                | 控制角色材质内边缘光总开关                    |
| `_Global_ShadowStrength`                                                                                                                | 控制角色身上的自阴影强度，支持超过 `1` 后继续压暗      |
| `_Global_EnvShadowStrength`                                                                                                             | 控制环境接收材质上的角色投影阴影和 Unity 主光阴影强度   |
| `_Global_OffsetMul` / `_Global_Threshold` / `_Global_Smooth`                                                                            | 控制材质内深度偏移边缘光的宽度、阈值和软硬            |
| `_Global_RimLightColor` / `_Global_RimIntensity` / `_Global_RimLightBrightness`                                                         | 控制外侧硬轮廓边缘光颜色、强度和亮度               |
| `_Global_InnerRimColor` / `_Global_InnerRimPower` / `_Global_InnerRimIntensity` / `_Global_InnerRimBrightness` / `_Global_InnerRimBias` | 控制内部 Fresnel 边缘光                 |
| `_Global_RimLightDirection` / `_Global_RimLightSoftness` / `_Global_RimLightOffset`                                                     | 控制对象空间 X 遮罩和世界方向法线遮罩，避免边缘光全身均匀出现 |

#### 可控 URP 附加光参数

当前版本新增了角色 Shader 侧的附加光控制。脚本会写入以下全局变量：

```hlsl
_Global_EnableAdditionalLights
_Global_AdditionalLightCount
_Global_AdditionalLightColor
_Global_AdditionalLightIntensity
_Global_AdditionalLightDiffuseIntensity
_Global_AdditionalLightSpecularIntensity
_Global_AdditionalLightRange
_Global_AdditionalLightShadowStrength
_Global_AdditionalLightControlCount
_Global_AdditionalLightControlPositions
_Global_AdditionalLightControlDirections
_Global_AdditionalLightControlColors
_Global_AdditionalLightControlParams
_Global_AdditionalLightControlParams2
_Global_AdditionalLightControlParams3
```

控制方式分两层：

| 层级     | 说明                                                                                                                                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 全局默认参数 | 没有被单独配置的 URP Additional Light 会使用 `additionalLightColor`、`additionalLightIntensity`、`additionalLightDiffuseIntensity`、`additionalLightSpecularIntensity`、`additionalLightRange`、`additionalLightShadowStrength` |
| 单灯覆盖参数 | `additionalLightControls` 最多支持 8 个灯光槽位，可为指定 `Light` 覆盖颜色、整体强度、漫反射强度、高光强度、阴影影响、点光范围、聚光范围、聚光角度和聚光边缘软硬                                                                                                             |

支持的灯光类型：

| 类型                | 控制项                                            |
| ----------------- | ---------------------------------------------- |
| Directional Light | 颜色、整体强度、漫反射强度、高光强度、阴影影响                        |
| Point Light       | 通用控制项 + `pointRange` 距离衰减倍率                    |
| Spot Light        | 通用控制项 + `spotRange`、`spotAngle`、`spotSoftness` |

注意：附加光数量仍受 URP Asset 的 Additional Lights 设置、Renderer 的 Per Object Limit 和 Shader 关键字 `_ADDITIONAL_LIGHTS` 影响。`additionalLightCount` 只是在角色自定义光照中进一步限制参与计算的数量。

#### 制作步骤

1. 在场景中创建空物体，例如 `Global Character Render Controller`。
2. 添加 `GlobalEnvLightController` 组件。
3. 调节 `selfShadowStrength` 控制角色自身阴影；值为 `1` 时是原始强度，`2~3` 会继续指数压暗。
4. 调节 `envShadowStrength` 控制角色投到环境接收材质上的阴影强度。
5. 调节 Rim Light 参数控制全局材质内边缘光。
6. 如果角色需要受点光 / 聚光 / 额外方向光影响，开启 `enableAdditionalLights`。
7. 使用全局 Additional Light 默认参数快速统一风格。
8. 如果某个灯需要单独调节，将场景中的 `Light` 拖入 `additionalLightControls` 并展开该槽位调整。

推荐初始参数：

| 参数                                    | 推荐值                |
| ------------------------------------- | ------------------:|
| `Enable Rim Light`                    | 开启                 |
| `Enable Additional Lights`            | 需要多光源时开启           |
| `Additional Light Count`              | 4 ~ 8              |
| `Additional Light Intensity`          | 0.5 ~ 1.5          |
| `Additional Light Diffuse Intensity`  | 0.5 ~ 1.2          |
| `Additional Light Specular Intensity` | 0.5 ~ 1.5          |
| `Additional Light Range`              | 1                  |
| `Additional Light Shadow Strength`    | 0 ~ 1              |
| `Self Shadow Strength`                | 1，近景可提高到 1.5 ~ 2.5 |
| `Env Shadow Strength`                 | 0.5 ~ 1            |
| `Offset Mul`                          | 0.008 ~ 0.015      |
| `Threshold`                           | 0.06 ~ 0.12        |
| `Smooth`                              | 0.03 ~ 0.08        |
| `Rim Intensity`                       | 0.5 ~ 1.5          |
| `Inner Rim Power`                     | 2 ~ 5              |
| `Inner Rim Intensity`                 | 0.5 ~ 2            |

---

### 6.2 `FaceDirection`

文件：

```text
Assets/Script/FaceDirection.cs
```

它通过四个 Transform 计算头部方向：

```csharp
Head
HeadForward
HeadRight
HeadUp
```

然后设置全局参数：

```hlsl
_HeadForward
_HeadRight
_HeadUp
_HeadPosition
```

这些参数主要用于：

- `S_Char_Face.shader` 的 SDF 脸部阴影。
- `S_Char_Hair.shader` 的球形头发高光。
- `S_Char_Eye.shader` 的侧面遮挡渐隐。

制作步骤：

1. 在角色头部骨骼附近创建 4 个参考点。
2. `Head` 放在头部中心。
3. `HeadForward` 放在脸朝向前方。
4. `HeadRight` 放在角色右侧。
5. `HeadUp` 放在头顶方向。
6. 场景中添加 `FaceDirection` 并绑定这些 Transform。

注意：方向点要跟随头骨运动，否则脸部阴影会和动画脱节。

---

### 6.3 `SmoothNormals`

文件：

```text
Assets/Script/SmoothNormals.cs
```

它用于将平滑法线写入模型：

```hlsl
TEXCOORD7 / UV2
```

公共描边函数会读取：

```hlsl
float4 uv2 : TEXCOORD2;
```

并还原世界空间平滑法线：

```hlsl
float3 smoothNormalWS = VNI.tangentWS * v.uv2.x + VNI.bitangentWS * v.uv2.y + VNI.normalWS * v.uv2.z;
```

这样描边不会沿硬法线裂开。

制作步骤：

1. 确保模型有法线和切线。
2. 在角色根节点添加 `SmoothNormals`。
3. 右键组件选择 `Generate and Save Smooth Normals`。
4. 脚本会标记 FBX / OBJ 的 `userData`。
5. 重新导入模型时，`AssetPostprocessor` 会将平滑法线写入 `UV2`。

注意事项：

- 如果模型缺少 Tangent，无法计算切线空间平滑法线。
- 写入后可用 `VertexNormalViewer` 检查法线 / 切线 / 副切线。
- 描边异常时，优先检查 `UV2` 是否存在。

---

## 7. `Char/Shader` 下的 Shader 方案总览

目录：

```text
Assets/Animator/Shader
├── S_Char_Body.shader
├── S_Char_Face.shader
├── S_Char_Hair.shader
├── S_Char_Cloth.shader
├── S_Char_Eye.shader
├── S_Char_Fur.shader
└── S_Char_Shadow.shader
```

公共库：

```text
Packages/com.zmd.shaderlibrary/S_Char_Common.hlsl
```

---

## 8. 公共库 `S_Char_Common.hlsl`

### 8.1 主要功能

`S_Char_Common.hlsl` 是角色 Shader 的公共函数库，当前承担的职责已经从“共享描边 / 阴影采样”扩展为“角色光照公共层”。主要模块如下：

| 功能                   | 函数 / 模块                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 阴影强度映射               | `SChar_ApplyShadowStrength`                                                                                                                             |
| Soft Light Ramp 混合   | `BlendSoftLight`                                                                                                                                        |
| 可控 URP 附加光数量和索引      | `SChar_GetControlledAdditionalLightsCount` / `SChar_GetAdditionalLightDataIndex`                                                                        |
| 附加光类型、范围、Spot 和阴影控制  | `SChar_IsAdditionalSpotLight` / `SChar_GetAdditionalLightRangeFactor` / `SChar_GetControlledSpotAttenuation` / `SChar_GetAdditionalLightShadowStrength` |
| 附加光漫反射               | `SChar_AdditionalLightsHalfLambert`                                                                                                                     |
| 附加光 Blinn-Phong 高光   | `SChar_AdditionalLightsBlinnPhong`                                                                                                                      |
| 附加光类 PBR 高光          | `SChar_AdditionalLightsPBRSpecular`                                                                                                                     |
| Shell 毛发附加光漫反射       | `SChar_AdditionalLightsFurDiffuse`                                                                                                                      |
| 逐物体屏幕空间阴影采样          | `SamplePerObjectScreenSpaceShadowmap`                                                                                                                   |
| 材质内 Anime Rim Light  | `CalculateAnimeRimLight`                                                                                                                                |
| 通用外描边 Pass           | `SChar_OutlineVert` / `SChar_OutlineFrag`                                                                                                               |
| 通用 ShadowCaster Pass | `SChar_ShadowVert` / `SChar_ShadowFrag`                                                                                                                 |

---

### 8.2 阴影强度映射

函数：

```hlsl
float SChar_ApplyShadowStrength(float shadowValue, float strength)
half3 SChar_ApplyShadowStrength(half3 shadowValue, float strength)
```

它用于统一处理角色自阴影、Unity 主光阴影和部分脸部遮罩阴影。逻辑可以理解为：

- `strength = 0`：完全不使用阴影，输出接近 `1`。
- `0 < strength < 1`：在线性区间内从无阴影逐渐过渡到原始阴影。
- `strength = 1`：保留原始阴影值。
- `strength > 1`：在原始阴影基础上继续使用幂函数压暗。

核心代码：

```hlsl
float linearStrength = saturate(safeStrength);
float powerStrength = max(safeStrength, 1.0);
float linearShadow = lerp(1.0, saturate(shadowValue), linearStrength);
return pow(max(linearShadow, 0.0001), powerStrength);
```

这也是为什么 `GlobalEnvLightController.selfShadowStrength` 的范围是 `0~3`：`0~1` 用于减弱，`1~3` 用于继续压暗。

---

### 8.3 Soft Light Ramp

函数：

```hlsl
half3 BlendSoftLight(half3 base, half3 blend)
{
    return (1.0 - 2.0 * blend) * base * base + 2.0 * blend * base;
}
```

作用：

- 比直接乘 Ramp 更柔和。
- 保留基础光照层次。
- 适合二次元角色暗部色阶。

---

### 8.4 可控 URP 附加光

当前公共库对 URP Additional Lights 做了一层角色专用封装，让角色 Shader 不直接吃 Unity 原始附加光结果，而是受 `GlobalEnvLightController` 统一控制。

#### 数量控制

```hlsl
uint SChar_GetControlledAdditionalLightsCount()
```

逻辑：

- 如果没有启用 `_ADDITIONAL_LIGHTS`，返回 `0`。
- 如果 `_Global_EnableAdditionalLights < 0.5`，返回 `0`。
- 最终数量取 Unity 的 `GetAdditionalLightsCount()` 与 `_Global_AdditionalLightCount` 的较小值。

#### 单灯匹配

```hlsl
int SChar_FindAdditionalLightControlIndex(uint lightIndex, Light light)
```

它会尝试把 URP 当前附加光与 `GlobalEnvLightController.additionalLightControls` 中的槽位匹配：

- Directional Light 通过方向匹配。
- Point Light 通过世界位置匹配。
- Spot Light 通过世界位置、类型和 Spot 方向匹配。

匹配成功后，该灯会使用单灯覆盖参数；匹配失败则使用全局默认参数。

#### 距离与 Spot 衰减控制

公共库会读取 Unity 内部附加光数据，然后重新计算受控衰减：

```hlsl
float SChar_GetControlledDistanceAttenuation(...)
float SChar_GetControlledSpotAttenuation(...)
```

这使角色 Shader 可以单独调整：

- 点光源范围倍率。
- 聚光灯范围倍率。
- 聚光灯外锥角倍率。
- 聚光灯边缘软硬倍率。

这些参数只改变角色 Shader 中的附加光表现，不会反向修改场景灯光本身。

#### 附加光输出函数

| 函数                                  | 用途                     | 使用部位          |
| ----------------------------------- | ---------------------- | ------------- |
| `SChar_AdditionalLightsHalfLambert` | 半兰伯特附加漫反射              | 皮肤、脸、头发、服装、眼睛 |
| `SChar_AdditionalLightsBlinnPhong`  | Blinn-Phong 附加高光       | 皮肤、脸、头发       |
| `SChar_AdditionalLightsPBRSpecular` | 带 Fresnel 和能量归一化的附加高光  | 服装            |
| `SChar_AdditionalLightsFurDiffuse`  | 带 Shell 高度补光偏移的毛发附加漫反射 | Shell 毛发      |

使用建议：

- 想要附加光影响角色，必须在 URP Asset 中开启 Additional Lights，并确保角色 Shader 编译了 `_ADDITIONAL_LIGHTS`。
- `additionalLightCount` 不应设置过高，通常 `4~8` 足够。
- 近景主角可让附加光同时影响漫反射和高光，远景角色可只保留漫反射或降低强度。

---

### 8.5 屏幕空间阴影采样

函数：

```hlsl
half3 SamplePerObjectScreenSpaceShadowmap(float4 shadowCoord)
```

输入通常是：

```hlsl
ComputeScreenPos(positionCS)
```

函数内部会先处理无效 `w`，再将屏幕坐标除以 `w`，经过 `UnityStereoTransformScreenSpaceTex` 后采样：

```hlsl
_PerObjectScreenSpaceShadowMap
```

输出是 RGB 阴影衰减值，角色 Shader 通常会这样使用：

```hlsl
half3 screenShadow = saturate(SamplePerObjectScreenSpaceShadowmap(i.perObjectShadowCoord));
half finalShadowStrength = _Global_ShadowStrength * _ShadowStrength;
half3 perObjectShadow = SChar_ApplyShadowStrength(screenShadow, finalShadowStrength) * coloredShadow;
```

---

### 8.6 材质内边缘光

函数：

```hlsl
CalculateAnimeRimLight(...)
```

它输出两种边缘光：

| 输出          | 类型             | 说明              |
| ----------- | -------------- | --------------- |
| `inner_rim` | 内部 Fresnel 边缘光 | 基于 `NdotV`，比较柔和 |
| `final_rim` | 深度偏移边缘光        | 基于深度差，轮廓更硬      |

计算中使用两个遮罩：

```hlsl
rimPosMask
rimDirMask
combinedRimMask = rimPosMask * rimDirMask;
```

作用：

- 用对象空间 X 轴控制左右区域。
- 用世界空间方向控制受光面。
- 防止边缘光全身均匀出现。

深度采样源会根据 Shader 是否定义 `S_CHAR_TRANSPARENT` 切换：

| 情况        | 深度来源                                |
| --------- | ----------------------------------- |
| 普通不透明角色材质 | `_CameraDepthTexture`               |
| 透明角色材质    | `_PerObjectTransparentDepthTexture` |

这样头发等透明材质可以使用透明深度图计算更稳定的材质内边缘光。

---

### 8.7 外描边

通用描边 Pass 使用反面膨胀：

```hlsl
Cull Front
```

顶点沿 `UV2` 中保存的切线空间平滑法线扩张：

```hlsl
float3 smoothNormalWS = VNI.tangentWS * v.UV2.x + VNI.bitangentWS * v.UV2.y + VNI.normalWS * v.UV2.z;
positionWS += smoothNormalWS * (_OutLine * 0.01 * outlineMask);
```

描边颜色：

```hlsl
half3 outlineColor = baseColor.rgb * _OutLineColor;
```

因此描边会带有基础色倾向，而不是纯色描边。

制作要点：

- 模型必须写入 `UV2` 平滑法线。
- 如使用 `_OutLineMask`，贴图白色处描边明显，黑色处描边收缩。
- 头发 Shader 暴露了 `_OutLineMask`，皮肤 / 脸部 / 衣服目前主要依赖默认白色贴图。

---

### 8.8 通用 ShadowCaster

公共 ShadowCaster 片元中有：

```hlsl
clip(0.5 - _PerObjectShadowEnabled);
```

含义：

- 当逐物体阴影启用时，可以裁掉普通 Unity ShadowCaster。
- 避免角色同时产生 Unity 阴影和自定义逐物体阴影，导致双重阴影。

然后再根据基础贴图 Alpha 裁剪：

```hlsl
clip(alpha - _AlphaClip);
```

---

## 9. 皮肤 Shader `S_Char_Body`

Shader：

```text
ZMD/S_Char_Body
```

文件：

```text
Assets/Animator/Shader/S_Char_Body.shader
```

### 9.1 效果目标

皮肤 Shader 负责：

- 基础色。
- 法线贴图。
- AO。
- NPR Ramp 漫反射。
- 皮肤二级色 Fresnel。
- Blinn-Phong 高光。
- 逐物体屏幕空间阴影。
- Unity 主光阴影辅助。
- 受控附加光漫反射和 Blinn-Phong 高光。
- 全局边缘光。
- 外描边。
- ShadowCaster 和 DepthOnly。

---

### 9.2 贴图与通道

| 贴图             | 通道  | 用途                                            |
| -------------- | --- | --------------------------------------------- |
| `_BaseColor`   | RGB | 皮肤基础色                                         |
| `_BaseColor`   | A   | AO，同时被 Depth / Shadow / Outline 用作 Alpha Clip |
| `_NormalMap`   | RGB | 法线贴图                                          |
| `_DiffuseRamp` | RGB | NPR Ramp                                      |

注意：`_BaseColor.a` 同时作为 AO 和 Alpha Clip，存在通道职责复用。如果后续角色需要真实透明裁剪，建议拆出独立 AO 或 Alpha 贴图。

---

### 9.3 顶点色作用

皮肤 Shader 使用顶点色 R：

```hlsl
normalTS = lerp(half3(0, 0, 1), normalTS, i.color.r);
```

作用：

- 控制法线贴图强度。
- 控制 Fresnel 二级色影响。

建议：

- 面部或不希望法线过强的区域，顶点色 R 可以低一些。
- 身体或需要皮肤细节的区域，顶点色 R 可以高一些。

---

### 9.4 光照流程

```mermaid
flowchart TD
    A[BaseColor / Normal / AO] --> B[法线转世界空间]
    B --> C[主光方向 NdotL]
    C --> D[Half Lambert]
    D --> E[采样 Diffuse Ramp]
    E --> F[Soft Light 混合]
    A --> G[Fresnel 二级色]
    G --> F
    F --> H[AO + PerObjectShadow]
    B --> I[主光 Blinn-Phong Specular]
    B --> I2[受控附加光漫反射 / 高光]
    B --> J[Anime Rim Light]
    H --> K[Final Color]
    I --> K
    I2 --> K
    J --> K
```

最终颜色：

```hlsl
half3 finalColor = final_diff + final_spec + final_rim + inner_rim;
```

---

### 9.5 参数调节建议

| 参数                   | 推荐调法            |
| -------------------- | --------------- |
| `_DarkColor`         | 控制整体暗部色调，不建议太黑  |
| `_SecondColor`       | 用于皮肤边缘偏色，可偏暖或偏粉 |
| `_RampStrength`      | 0.5 ~ 1，越高越 NPR |
| `_DarkIntensity`     | 暗部过死时提高         |
| `_ShadowColor`       | 配合逐物体阴影染色       |
| `_ShadowStrength`    | 角色材质自身阴影强度      |
| `_SpecularIntensity` | 皮肤一般不宜过高        |
| `_SpecShininese`     | 数值越高高光越小越锐      |

---

## 10. 脸部 Shader `S_Char_Face`

Shader：

```text
ZMD/S_Char_Face
```

文件：

```text
Assets/Animator/Shader/S_Char_Face.shader
```

### 10.1 效果目标

脸部 Shader 重点解决二次元脸部光影问题：

- 使用 SDF 控制脸部明暗分界。
- 根据头部方向和主光方向决定左右脸阴影。
- 支持下巴阴影、自阴影遮罩、二级色遮罩。
- 支持唇部 / 局部高光。
- 支持受控附加光漫反射和 Blinn-Phong 高光，但建议强度轻一些，避免破坏 SDF 阴影设计。
- 可开启 Simple Mode 简化计算。

---

### 10.2 贴图与通道

| 贴图             | 通道  | 用途                  |
| -------------- | --- | ------------------- |
| `_BaseColor`   | RGB | 脸部基础色               |
| `_BaseColor`   | A   | AO                  |
| `_ColorMask`   | R   | 二级色遮罩之一             |
| `_ColorMask`   | G   | 下巴阴影 / Lambert 混合权重 |
| `_ColorMask`   | B   | 自阴影遮罩               |
| `_ColorMask`   | A   | 高光遮罩                |
| `_SDF`         | R/G | 背光 / 正面 SDF 阴影控制    |
| `_LipSpecMask` | R   | 唇部高光遮罩              |
| `_DiffuseRamp` | RGB | NPR Ramp            |

---

### 10.3 SDF 阴影原理

脸部不直接使用普通法线 Lambert 作为主阴影，而是先把主光投影到头部水平面：

```hlsl
half3 lightOnHeadPlane = mainLight.direction - headUpDir * dot(mainLight.direction, headUpDir);
half3 headPlaneLightDir = normalize(lightOnHeadPlane);
```

然后判断光从左边还是右边来：

```hlsl
half LOR = step(dot(headPlaneLightDir, headRightDir), 0.0);
half4 activeSdf = lerp(sdfRight, sdfLeft, LOR);
```

再根据光线和头部前方向的点积，采样 SDF 贴图：

```hlsl
half sdf_dot = dot(headPlaneLightDir, headForwardDir);
```

最终得到：

```hlsl
half sdfShaodw = min(saturate(lerp(frontShadow, backShadow, channelBlend)), unityShadow);
```

这种方案能让脸部阴影始终保持美术设计好的形状，避免普通法线光照导致脸上出现破碎阴影。

---

### 10.4 与 `FaceDirection` 的关系

脸部 Shader 依赖：

```hlsl
_HeadForward
_HeadRight
_HeadUp
```

因此必须在场景中配置 `FaceDirection`。如果方向错误，会出现：

- 左右脸阴影反了。
- 角色转头时阴影不跟随。
- 背光和正面光判断错误。

---

### 10.5 制作步骤

1. 给脸部材质使用 `ZMD/S_Char_Face`。
2. 准备 `_BaseColor`、`_ColorMask`、`_SDF`、`_LipSpecMask`、`_DiffuseRamp`。
3. 配置 `FaceDirection` 头部方向点。
4. 调节 `_SoftShadow` 控制 SDF 阴影边缘软硬。
5. 调节 `_RampStrength` 控制 Ramp 风格强弱。
6. 调节 `_SpecularIntensity` 和 `_LipSpecMask` 控制唇部 / 脸部高光。
7. 如果移动端或远景角色需要简化，可开启 `_SIMPLE_MODE`。

---

## 11. 头发 Shader `S_Char_Hair`

Shader：

```text
ZMD/S_Char_Hair
```

文件：

```text
Assets/Animator/Shader/S_Char_Hair.shader
```

### 11.1 效果目标

头发 Shader 负责：

- 半透明头发渲染。
- 前发透明遮罩。
- 头发线条染色。
- 法线贴图。
- NPR Ramp 漫反射。
- 顶光补光。
- 主光各向异性高光。
- 受控附加光漫反射和 Blinn-Phong 高光。
- 环境反射。
- 逐物体阴影。
- 透明深度预写入。
- 描边。

---

### 11.2 Pass 结构

| Pass                | LightMode                 | 作用                        |
| ------------------- | ------------------------- | ------------------------- |
| `Hair_Transparency` | `Hair_Transparency`       | 只渲染前发透明区域，用于透过半透明头发看到其他头发 |
| `UniversalForward`  | `UniversalForwardOnly`    | 主要头发颜色与光照                 |
| `DepthOnly`         | `TransparentDepthPrepass` | 写入透明头发深度                  |
| `ShadowCaster`      | `ShadowCaster`            | 阴影投射                      |
| `Outline`           | `SRPDefaultUnlit`         | 外描边                       |

---

### 11.3 贴图与通道

| 贴图             | 通道    | 用途                       |
| -------------- | ----- | ------------------------ |
| `_BaseColor`   | RGB/A | 头发基础色与透明度                |
| `_Normal`      | RG    | 主法线                      |
| `_Normal`      | BA    | 高光线用法线                   |
| `_Mask`        | R     | 前发遮罩，`1 - R` 为 frontHair |
| `_Mask`        | G     | 高光遮罩                     |
| `_Mask`        | B     | AO                       |
| `_HairLine`    | R     | 发丝线条染色                   |
| `_Aniso`       | R     | 各向异性噪声                   |
| `_OutLineMask` | R     | 描边宽度遮罩                   |

---

### 11.4 各向异性高光

头发高光使用球形头部参考和切线方向构建：

```hlsl
float3 sphereNormalWS = normalize(vertexInput.positionWS - (_HeadPosition.xyz + float3(0, _AnisoPosition, 0)));
float3 sphereBitangentWS = normalize(cross(sphereNormalWS, cameraRightWS));
```

片元中根据 `_Aniso` 噪声偏移 binormal：

```hlsl
half3 anisoOffset = sphereNormalWS * (anisoNoise * _AnisoNoise + _AnisoOffset);
half3 binormal = normalize(sphereBitangentWS + anisoOffset);
half BdotH = dot(binormal, halfDir);
half specTemp = pow(sqrt(saturate(1.0 - BdotH * BdotH)), _AnisoShininess);
```

这类高光适合表现二次元头发上的环形、条带状高光。

附加光高光目前通过公共库的 `SChar_AdditionalLightsBlinnPhong` 叠加，使用的是更通用的 Blinn-Phong 形式；它适合补充局部灯光亮斑，但不替代主光各向异性条带高光。

---

### 11.5 半透明深度与眼睛遮挡

头发的 `TransparentDepthPrepass` 会被 `PerObjectTransparentDepthPass` 捕获，写入：

```hlsl
_PerObjectTransparentDepthTexture
```

眼睛 Shader 采样这张深度图后，可以判断眼睛是否被头发遮挡，并进行染色和透明度衰减。

---

### 11.6 参数调节建议

| 参数                      | 作用          | 建议                   |
| ----------------------- | ----------- | -------------------- |
| `_Alpha`                | 整体透明度倍率     | 1 起调                 |
| `_AlphaClip`            | 主 Pass 裁剪阈值 | 0.3 ~ 0.6            |
| `_DepthAlphaClip`       | 深度预写入阈值     | 当前 Pass 未使用该参数，可后续扩展 |
| `_TopLightIntensity`    | 顶部补光强度      | 二次元头发可适当提高           |
| `_AnisoShininess`       | 高光锐度        | 越高越细                 |
| `_AnisoOffset`          | 高光位置偏移      | 用于移动高光条              |
| `_CutOffset`            | 高光切割        | 控制断裂高光               |
| `_EnvSpecularIntensity` | 环境高光强度      | 0.2 ~ 0.8            |

---

## 12. 服装 Shader `S_Char_Cloth`

Shader：

```text
ZMD/S_Char_Cloth
```

文件：

```text
Assets/Animator/Shader/S_Char_Cloth.shader
```

### 12.1 效果目标

服装 Shader 是 NPR 与简化 PBR 的混合方案，负责：

- 基础色 Tint 和对比度调整。
- 法线贴图。
- MOR 金属 / AO / 粗糙度贴图。
- NPR Ramp 漫反射。
- 金属 / 非金属粗糙度分离调整。
- 主光直接高光。
- 受控附加光漫反射和类 PBR 高光。
- 环境反射。
- 自发光。
- 对象空间渐变色。
- 逐物体屏幕空间阴影。
- 全局边缘光。
- 外描边。

---

### 12.2 贴图与通道

| 贴图             | 通道    | 用途               |
| -------------- | ----- | ---------------- |
| `_BaseColor`   | RGB/A | 基础色 / Alpha Clip |
| `_NormalMap`   | RGB   | 法线               |
| `_MOR`         | R     | Metallic         |
| `_MOR`         | B     | AO               |
| `_MOR`         | A     | Roughness        |
| `_Emission`    | RGB   | 自发光              |
| `_DiffuseRamp` | RGB   | NPR Ramp         |

`_MOR.g` 当前没有明显参与核心计算，可作为预留通道。

---

### 12.3 光照流程

服装漫反射：

```hlsl
half halfLambert = NdotL * 0.5 + 0.5;
half halfLambertShadow = min(halfLambert, unityShadow);
half3 rampLambert = SAMPLE_TEXTURE2D(_DiffuseRamp, sampler_DiffuseRamp, half2(halfLambert, 0.5)).rgb * halfLambertShadow;
half3 rampDiffuse = BlendSoftLight(base_color * mainLight.color, rampLambert);
half3 grayDiffuse = base_color * mainLight.color * halfLambertShadow;
half3 baseDiffuse = lerp(grayDiffuse, rampDiffuse, _RampStrength);
```

直接高光使用能量归一化 Blinn-Phong + Schlick Fresnel：

```hlsl
half3 fresnelTerm = spec_color + (1.0 - spec_color) * pow(1.0 - VdotH, 5.0);
half spec_temp = pow(NdotH, shininess) * energyConservation;
```

环境高光使用：

```hlsl
GlossyEnvironmentReflection
```

受控附加光会分两路叠加：

```hlsl
half3 additionalDiffuse = SChar_AdditionalLightsHalfLambert(i.positionWS, normalWS, base_color, 0.0h);
half3 additionalSpec = SChar_AdditionalLightsPBRSpecular(i.positionWS, normalWS, viewDirWS, spec_color, _SpecularColor.rgb, _SpecularIntensity, shininess);
```

其中附加高光使用 Schlick Fresnel、能量归一化和 `GlobalEnvLightController` 的单灯参数控制，适合让 Point / Spot Light 在金属、皮革、布料上产生可控高光。

阴影方面，当前服装 Shader 使用：

```hlsl
half unityShadow = SChar_ApplyShadowStrength(mainLight.shadowAttenuation, _Global_ShadowStrength);
half3 perObjectShadow = SChar_ApplyShadowStrength(screenShadow, finalShadowStrength) * coloredShadow;
```

因此 `_Global_ShadowStrength` 和材质 `_ShadowStrength` 会共同影响服装的自阴影压暗程度。

因此服装比皮肤更偏类 PBR 表现，适合金属、皮革、布料混合材质。

---

### 12.4 渐变色

当前服装 Shader 使用对象空间 X 轴派生渐变值：

```hlsl
half gradient = saturate((1 - i.positionOS.x - _GradientMinY) / (_GradientMaxY - _GradientMinY + 1e-5));
half3 diffGradient = lerp(baseDiffuse * _GradientColor.rgb, baseDiffuse, gradient);
half3 additionalDiffGradient = lerp(additionalDiffuse * _GradientColor.rgb, additionalDiffuse, gradient);
```

这意味着 `_GradientMinY` / `_GradientMaxY` 名称虽然保留了旧的 Y 轴命名，但当前实际控制的是对象空间 X 方向上的渐变区间。

用途：

- 给左右方向增加风格化色差。
- 对袖口、裙摆、装饰带等沿对象空间 X 分布的区域做颜色变化。
- 同时影响主光漫反射和附加光漫反射，让补光下的渐变保持一致。

如果后续需要真正的上下渐变，可以把计算中的 `i.positionOS.x` 改回 `i.positionOS.y`，并同步重命名材质参数以避免误解。

---

### 12.5 制作步骤

1. 给服装材质使用 `ZMD/S_Char_Cloth`。
2. 准备 `_BaseColor`、`_NormalMap`、`_MOR`、`_Emission`、`_DiffuseRamp`。
3. 调节 `_TintColor` 和 `_BaseColor_Contrast` 定基础色。
4. 调节 `_Metallic`、`_Roughness` 系列参数区分金属与布料。
5. 调节 `_RampStrength` 确定 NPR 强度。
6. 调节 `_EnvSpecularIntensity` 和 `_EnvSmoothness` 控制环境反射。
7. 如果需要局部发光，使用 `_Emission` + `_EmissionColor`。
8. 如需描边，确保模型已经写入 `UV2` 平滑法线。

---

## 13. 眼睛 Shader `S_Char_Eye`

Shader：

```text
ZMD/S_Char_Eye
```

文件：

```text
Assets/Animator/Shader/S_Char_Eye.shader
```

### 13.1 效果目标

眼睛 Shader 负责：

- 透明队列绘制眼睛。
- 视线方向轻微 Offset，避免 Z 冲突。
- 眼球 MatCap 高光。
- 伪球面法线。
- 视差偏移。
- 受控附加光半兰伯特补光。
- 头发遮挡变暗。
- 侧面视角遮挡渐隐。
- 眉毛模式。

---

### 13.2 两种模式

通过：

```hlsl
_USE_EYEBROW_MODE
```

切换。

| 模式           | 用途                            |
| ------------ | ----------------------------- |
| 普通眼睛模式       | 眼球 BaseMap + MatCap + 高光 + 视差 |
| Eyebrow Mode | 眉毛透明贴图 + 简单光照                 |

---

### 13.3 眼球 MatCap 与视差

视差：

```hlsl
float2 para_offset = (tanViewdir.xy / (tanViewdir.z + 0.42f)) * _Parallax * sphereMask;
```

MatCap 使用 UV 构造伪球体法线：

```hlsl
half2 centeredUV = (i.uv - 0.5) * 2.0;
half sphereZ = sqrt(max(0.0, 1.0 - dot(centeredUV, centeredUV)));
half3 fakeNormalTS = normalize(half3(centeredUV.x, centeredUV.y, sphereZ));
```

这样即使眼睛是简单面片，也能做出类似球面反光。

---

### 13.4 头发遮挡

眼睛 Shader 会采样头发透明深度：

```hlsl
float rawHairDepth = SAMPLE_TEXTURE2D_X(_PerObjectTransparentDepthTexture, sampler_PointClamp, hairUV).r;
float hairLinearDepth = LinearEyeDepth(rawHairDepth, _ZBufferParams);
float hairDepthDelta = currentLinearDepth - hairLinearDepth;
```

然后计算遮挡：

```hlsl
half hairOcclusion = smoothstep(0.0, _HairDepthFade, hairDepthDelta);
```

遮挡时会：

- 混入 `_HairOcclusionColor`。
- 降低透明度到 `_HairOcclusionAlpha`。
- 根据 `_HeadForward` 与视线方向进行侧面渐隐。

---

### 13.5 制作步骤

1. 给眼睛材质使用 `ZMD/S_Char_Eye`。
2. 准备 `_BaseMap`、`_MatCapMap1`、`_Mask`。
3. 设置 `_Offset`，让眼睛略微向相机方向偏移，减少深度冲突。
4. 调节 `_Parallax` 制造眼球深度感。
5. 调节 MatCap 强度和高光颜色。
6. 确保场景中有 `FaceDirection`，否则侧面渐隐方向会不准确。
7. 确保头发写入 `TransparentDepthPrepass`，否则头发遮挡效果不完整。

---

## 14. 特殊透明阴影 Shader `S_Char_Shadow`

Shader：

```text
ZMD/S_Char_Shadow
```

文件：

```text
Assets/Animator/Shader/S_Char_Shadow.shader
```

### 14.1 效果定位

这是一个透明阴影 / 特殊遮罩 Shader，可用于：

- 角色局部透明阴影片。
- 眼部阴影贴片。
- 基于深度剔除的透明投影。

---

### 14.2 普通模式

普通模式采样场景深度，根据当前片元与场景深度差控制 Alpha：

```hlsl
float alpha = step((eyeDepth - ScreenPos.w), _DepthClip) * _TransparentColor.a;
clip(alpha - 0.001);
```

适合让一张透明阴影片只在贴近表面时显示。

---

### 14.3 Eye Shadow Mode

开启：

```hlsl
_USE_EYE_SHADOW
```

后会：

- 沿相机方向偏移 `_EyeShadowOffset`。
- 采样 `_ShadowMask`。
- 输出 `_TransparentColor.rgb` 和 Mask Alpha。

适合眼睛、刘海、脸部局部投影阴影。

---

## 15. 推荐完整制作流程

### 15.1 模型准备

角色模型建议具备：

- 正确的法线。
- 正确的切线。
- 合理拆分材质：脸、皮肤、头发、服装、眼睛、毛发。
- 需要描边的部分写入 `UV2` 平滑法线。
- 头发、脸部、眼睛拥有稳定的头部骨骼方向参考点。
- 如使用逐物体阴影，角色最好有 Collider 作为紧凑包围盒。

---

### 15.2 写入平滑法线

1. 选中角色根节点。
2. 添加 `SmoothNormals`。
3. 右键组件选择 `Generate and Save Smooth Normals`。
4. 等待 FBX / OBJ 重新导入。
5. 用 `VertexNormalViewer` 检查法线、切线、副切线。

如果描边裂开，优先检查：

- 模型是否有切线。
- `UV2` 是否成功写入。
- 描边 Pass 是否拿到了正确的 `_OutLineMask`。

---

### 15.3 创建角色材质

建议材质分配：

| 部位      | Shader                    |
| ------- | ------------------------- |
| 皮肤 / 身体 | `ZMD/S_Char_Body`         |
| 脸       | `ZMD/S_Char_Face`         |
| 头发      | `ZMD/S_Char_Hair`         |
| 服装      | `ZMD/S_Char_Cloth`        |
| 眼睛 / 眉毛 | `ZMD/S_Char_Eye`          |
| 毛发 / 绒毛 | `ZMD/Fur_RendererFeature` |
| 特殊透明阴影片 | `ZMD/S_Char_Shadow`       |

---

### 15.4 配置全局控制器

场景中新建空物体：

```text
Global Character Render Controller
```

添加：

```text
GlobalEnvLightController
```

推荐初始参数：

| 参数                                    | 推荐值                  |
| ------------------------------------- | --------------------:|
| `Enable Rim Light`                    | 开启                   |
| `Enable Additional Lights`            | 需要角色受附加光影响时开启        |
| `Additional Light Count`              | 4 ~ 8                |
| `Additional Light Intensity`          | 0.5 ~ 1.5            |
| `Additional Light Diffuse Intensity`  | 0.5 ~ 1.2            |
| `Additional Light Specular Intensity` | 0.5 ~ 1.5            |
| `Additional Light Shadow Strength`    | 0 ~ 1                |
| `Self Shadow Strength`                | 1，近景主角可提高到 1.5 ~ 2.5 |
| `Env Shadow Strength`                 | 0.5 ~ 1              |
| `Offset Mul`                          | 0.008 ~ 0.015        |
| `Threshold`                           | 0.06 ~ 0.12          |
| `Smooth`                              | 0.03 ~ 0.08          |
| `Rim Intensity`                       | 0.5 ~ 1.5            |
| `Inner Rim Power`                     | 2 ~ 5                |
| `Inner Rim Intensity`                 | 0.5 ~ 2              |

如果需要单独控制某个 Point / Spot / Directional Light 对角色的影响，将该 `Light` 拖入 `additionalLightControls`，再按灯光类型调整颜色、强度、范围、聚光角度和阴影影响。

---

### 15.5 配置头部方向

角色上添加或场景中添加：

```text
FaceDirection
```

绑定：

- `Head`
- `HeadForward`
- `HeadRight`
- `HeadUp`

检查方式：

- 主光从角色左边来时，脸部阴影应落在正确侧。
- 角色转头后，SDF 阴影应跟随头部旋转。
- 眼睛侧面渐隐方向应和头部前向一致。

---

### 15.6 配置逐物体阴影

1. 在 URP Renderer 中添加 `PerObjectShadowFeature`。
2. 角色根节点添加 `PerObjectShadowProjector`。
3. 调用 `CollectRenderers`。
4. 确认角色材质有 `_StencilRef`。
5. 调节 `GlobalEnvLightController.selfShadowStrength`，先从 `1` 开始。
6. 在角色材质中调节 `_ShadowStrength` 和 `_ShadowColor`。

调试顺序：

1. 先确认 `_PerObjectScreenSpaceShadowMap` 是否有输出。
2. 再确认角色 Shader 是否采样该贴图。
3. 再调 Feature 的 Bias / PCF / Resolution。
4. 再调 `GlobalEnvLightController.selfShadowStrength`，需要更强阴影时可提高到 `1.5~2.5`。
5. 最后调材质的 `_ShadowColor` 和 `_ShadowStrength`。

---

### 15.7 配置环境接收阴影

如果希望角色阴影投射到地面或场景物体上，可给对应环境材质使用：

```text
PerObjectShadow/ScreenSpaceShadowReceiver
```

文件：

```text
Assets/Env/Shader/PerObjectScreenSpaceShadowReceiver.shader
```

该 Shader 会同时采样：

- URP 主光阴影 `mainLight.shadowAttenuation`。
- 自定义逐物体屏幕阴影 `_PerObjectScreenSpaceShadowMap`。
- SSAO 的 `directAmbientOcclusion`。

并由 `GlobalEnvLightController.envShadowStrength` 写入的 `_Global_EnvShadowStrength` 统一控制环境阴影强度。

制作步骤：

1. 给地面 / 墙面 / 接收阴影的环境物体使用 `PerObjectShadow/ScreenSpaceShadowReceiver`。
2. 准备 `_MaskMap`，用 R 通道在 `_Color1` 和 `_Color2` 之间插值。
3. 确保环境物体的 Stencil 为 `0`，该 Shader 的 Forward 和 DepthOnly Pass 都使用 `Comp Equal Ref 0`，避免画到角色自身 Stencil 区域。
4. 在 `GlobalEnvLightController` 中调节 `envShadowStrength`。
5. 如果环境阴影过重，先降低 `envShadowStrength`；如果只有角色身上有阴影而环境没有，检查材质是否已换成接收 Shader。

---

### 15.8 配置头发透明深度

头发 Shader 已提供：

```hlsl
Tags { "LightMode" = "TransparentDepthPrepass" }
```

`PerObjectShadowFeature` 会在屏幕空间阴影 Pass 前后入队 `PerObjectTransparentDepthPass`。

确保：

- 头发材质使用 `ZMD/S_Char_Hair`。
- 头发对象在透明队列。
- 眼睛材质能够采样 `_PerObjectTransparentDepthTexture`。
- 透明头发如需材质内边缘光，可让 Shader 使用透明深度路径，避免只依赖 `_CameraDepthTexture`。

---

### 15.9 配置 URP 附加光

如果需要点光、聚光或额外方向光参与角色自定义光照：

1. 在 URP Asset 中开启 Additional Lights。
2. 确认 Renderer / URP Asset 的 Additional Lights Per Object Limit 足够。
3. 在 `GlobalEnvLightController` 中开启 `enableAdditionalLights`。
4. 设置 `additionalLightCount`，通常 `4~8`。
5. 使用全局默认参数统一控制没有单独配置的附加光。
6. 对关键灯光使用 `additionalLightControls` 单独覆盖颜色、强度、漫反射、高光、阴影、范围和 Spot 参数。

注意：附加光只影响已经接入 `SChar_AdditionalLights*` 函数的角色 Shader；当前皮肤、脸、头发、服装、眼睛和 Shell 毛发都已经接入对应函数。

---

### 15.10 配置 Shell 毛发

1. URP Renderer 添加 `FurFeature`。
2. 毛发对象材质使用 `ZMD/Fur_RendererFeature`。
3. 设置 `FurFeature.step`，推荐 20 ~ 40。
4. 准备 `_FurMask`、`_FurDir`、`_Noise`。
5. 如果毛发需要运动惯性，添加 `FurInertia`。
6. 骨骼毛发使用 `Bones` 模式并检测保存骨骼。

---

## 16. 参数调试路线

### 16.1 先调角色自阴影

推荐顺序：

1. `GlobalEnvLightController.selfShadowStrength = 1`。
2. 单个角色开启 `PerObjectShadowProjector`。
3. `SelfShadow` 使用 `1024` 或 `2048` 分辨率。
4. `PCF` 使用 `Medium_5x5`。
5. 调整 `Depth Bias` 消除粉刺。
6. 调整 `Normal Bias` 消除漂浮。
7. 调整材质 `_ShadowColor` 控制阴影颜色。
8. 如果阴影层次不够，逐步提高 `selfShadowStrength` 到 `1.5~2.5`，利用 `SChar_ApplyShadowStrength` 的指数区间继续压暗。

---

### 16.2 再调环境接收阴影

推荐顺序：

1. 给接收物体使用 `PerObjectShadow/ScreenSpaceShadowReceiver`。
2. 确认 `_PerObjectScreenSpaceShadowMap` 在角色周围有输出。
3. `GlobalEnvLightController.envShadowStrength` 从 `0.5` 起调。
4. 如果环境本身也开启 Unity 主光阴影，注意它会和逐物体阴影取更暗结果。
5. 使用 `_MaskMap`、`_Color1`、`_Color2` 定环境基础色，不要只靠阴影压暗环境。

---

### 16.3 再调基础光照

皮肤：

- 先确定 `_DarkColor`。
- 再调 `_SecondColor`。
- 最后调 `_RampStrength`。
- 如需局部补光，再通过 `GlobalEnvLightController` 的附加光参数调节漫反射和高光。

脸：

- 先校准 `FaceDirection`。
- 再调 `_SoftShadow`。
- 最后调 `_ColorMask` 和高光。
- 附加光只建议轻微补亮，避免破坏脸部 SDF 阴影设计。

头发：

- 先调透明裁剪。
- 再调发丝线 `_HairLine`。
- 再调各向异性高光。
- 最后调环境反射和附加光高光。

服装：

- 先调基础色和 MOR。
- 再调 Ramp。
- 再调主光高光和环境反射。
- 再调附加光类 PBR 高光。
- 最后调渐变和自发光。

---

### 16.4 调 URP 附加光

推荐顺序：

1. 确认 URP Asset 开启 Additional Lights。
2. `GlobalEnvLightController.enableAdditionalLights = true`。
3. `additionalLightCount` 先设为 `4`。
4. 全局 `additionalLightIntensity` 先设为 `1`。
5. 如果只想补亮暗部，降低 `additionalLightSpecularIntensity`。
6. 如果只想增加高光，降低 `additionalLightDiffuseIntensity`。
7. 对关键 Point / Spot Light 使用 `additionalLightControls` 单独调整范围、角度和阴影影响。

---

### 16.5 最后调边缘光和描边

边缘光：

- `Offset Mul` 控制宽度。
- `Threshold` 控制出现门槛。
- `Smooth` 控制软硬。
- `RimLightDirection` 和对象空间 X 遮罩控制方向性。
- 透明头发的材质内边缘光会优先依赖 `_PerObjectTransparentDepthTexture`，需要先保证透明深度有效。

描边：

- `_OutLine` 控制宽度。
- `_OutLineColor` 控制颜色乘法。
- `_OutLineMask` 控制局部描边强度。
- `UV2` 平滑法线决定描边是否稳定。

---

## 17. 常见问题与排查

### 17.1 逐物体阴影完全不显示

检查：

- URP Renderer 是否添加 `PerObjectShadowFeature`。
- 场景是否有 Directional Light，且被 URP 识别为主光。
- 角色是否添加 `PerObjectShadowProjector`。
- `activeProjectors` 是否为空。
- 角色 Renderer 是否被 `CollectRenderers` 收集。
- Shader 是否采样 `_PerObjectScreenSpaceShadowMap`。
- `GlobalEnvLightController.selfShadowStrength` 是否为 0。
- 角色材质 `_ShadowStrength` 是否为 0。
- 如果 `selfShadowStrength > 1` 仍然很淡，检查 `screenShadow` 是否本身接近白色。

---

### 17.2 自阴影串到其他角色身上

检查：

- 每个角色是否有独立 `_StencilRef`。
- `PerObjectShadowProjector` 是否成功克隆并写入材质 `_StencilRef`。
- 角色 Shader Forward / Depth Pass 是否写 Stencil。
- 自阴影 Volume Pass 是否使用正确 Stencil Ref。

---

### 17.3 阴影抖动

检查：

- `Use Collider Bounds` 是否开启。
- Collider Bounds 是否稳定。
- SkinnedMeshRenderer 的 Renderer Bounds 是否过大或随动画跳动。
- ShadowMap 分辨率是否过低。
- `followCameraOrthoSizeScale` 是否过小。

---

### 17.4 阴影粉刺或漂浮

粉刺：

- 增加 `Depth Bias`。
- 增加 PCF。
- 提高 ShadowMap 分辨率。

漂浮：

- 降低 `Normal Bias`。
- 降低 `Depth Bias`。
- 检查模型法线是否异常。

---

### 17.5 描边裂开

检查：

- 是否生成了 `UV2` 平滑法线。
- 模型是否有 Tangent。
- `SmoothNormals` 是否成功重新导入模型。
- 是否有多个断开的 UV / 顶点导致平滑法线不连续。
- `_OutLineMask` 是否为黑色。

---

### 17.6 脸部阴影左右反了

检查：

- `HeadRight` 是否真的在角色右侧。
- `HeadForward` 是否真的指向脸前方。
- SDF 左右贴图通道是否符合 Shader 的翻转逻辑。
- 角色模型是否存在镜像缩放。

---

### 17.7 眼睛被头发遮挡不正确

检查：

- 头发是否使用 `ZMD/S_Char_Hair`。
- 头发是否执行 `TransparentDepthPrepass`。
- `PerObjectTransparentDepthPass` 是否被入队。
- `_PerObjectTransparentDepthTexture` 是否有正确深度。
- `_HairDepthFade` 是否过大或过小。

---

### 17.8 Shell 毛发层数太明显

检查：

- 提高 `FurFeature.step`。
- 提高 `_FurMaxLayer`。
- 调整 `_NoiseScale` 和 `_OpacityPow`。
- 降低 `_Thick`。
- 调整 `_ConePow` 让毛尖更自然。

---

### 17.9 环境接收阴影不显示

检查：

- 接收物体材质是否使用 `PerObjectShadow/ScreenSpaceShadowReceiver`。
- `GlobalEnvLightController.envShadowStrength` 是否为 0。
- `_PerObjectScreenSpaceShadowMap` 是否已有角色阴影输出。
- 环境物体 Stencil 是否为 `0`；该 Shader 使用 `Ref 0`、`Comp Equal`，如果被其它 Pass 写了非 0 Stencil 会被跳过。
- 接收物体是否在相机深度图中正常写入深度。
- 如果只看到 Unity 主光阴影，看不到角色逐物体阴影，优先检查 `PerObjectShadowFeature` 的环境阴影配置和屏幕空间 Pass 时机。

---

### 17.10 URP 附加光不影响角色

检查：

- URP Asset 是否开启 Additional Lights。
- Renderer / URP Asset 的 Additional Lights Per Object Limit 是否大于 0。
- `GlobalEnvLightController.enableAdditionalLights` 是否开启。
- `GlobalEnvLightController.additionalLightCount` 是否大于 0。
- 对应角色 Shader 是否编译 `_ADDITIONAL_LIGHTS`。
- 灯光是否被 Culling Mask、Rendering Layer 或距离剔除排除。
- 如果单灯覆盖不生效，检查 `additionalLightControls` 中绑定的 `Light` 是否仍然启用，并且 Point / Spot / Directional 类型是否匹配。
- 如果附加光过亮，先降低 `additionalLightIntensity`，再分别调 `additionalLightDiffuseIntensity` 和 `additionalLightSpecularIntensity`。

---

## 18. 性能建议

### 18.1 逐物体阴影

- 控制 `maxShadowObjects`，不要无上限开启。
- 近景角色使用高分辨率，远景角色降低或关闭 Projector。
- `PCF High 7x7` 只推荐用于主角近景。
- 尽量使用 Collider Bounds，减少阴影相机覆盖面积。
- 多角色时注意 ShadowMap Atlas 尺寸增长。

### 18.2 边缘光

- 材质内边缘光会在每个角色材质中计算，适合精细控制。
- 后处理边缘光是全屏 Pass，但只对 Mask 区域输出。
- 两套边缘光同时开启时，注意强度不要叠得过亮。

### 18.3 Shell 毛发

- `step` 是最大性能开销来源。
- 远景依赖 Shader 内 LOD 减少有效层数。
- 尽量缩小毛发网格面积。
- 不需要惯性的静态毛发可以不挂 `FurInertia`。

### 18.4 透明头发和眼睛

- 透明队列排序和深度预写入容易互相影响。
- 头发透明裁剪阈值不要过低，否则深度图会过厚。
- 眼睛 `ZTest Always` 依赖手动深度裁剪，参数需要按模型调。

### 18.5 URP 附加光

- `additionalLightCount` 只保留实际需要影响角色的数量，通常 `4~8` 足够。
- Point / Spot Light 数量过多时，角色每个像素都要额外循环光源，成本会明显增加。
- 远景角色可关闭 `enableAdditionalLights` 或降低附加光强度。
- 如果只需要气氛补光，优先降低高光强度，减少闪烁和过曝。
- 单灯覆盖槽位最多 8 个，不要把所有场景灯都拖进去，只管理对角色观感关键的灯。

### 18.6 环境接收阴影

- `PerObjectShadow/ScreenSpaceShadowReceiver` 会采样屏幕空间阴影、Unity 主光阴影和 SSAO，接收物体越多，覆盖像素越多。
- 只给需要接收角色阴影的地面、墙面或关键环境物体使用接收 Shader。
- 如果环境阴影只是轻微接触阴影，优先降低 `envShadowStrength`，不要增加 ShadowMap 分辨率。

---

## 19. 推荐最终渲染配置清单

### Renderer Feature

至少添加：

```text
PerObjectShadowFeature
FurFeature
```

可选添加：

```text
DepthOffsetRimFeature
```

### 场景控制器

至少添加：

```text
GlobalEnvLightController
FaceDirection
```

按需添加：

```text
SmoothNormals
VertexNormalViewer
FurInertia
DemoAnimController
LightRotater
MouseOrbit
```

### 环境材质

需要接收角色投影阴影的环境物体使用：

```text
PerObjectShadow/ScreenSpaceShadowReceiver
```

### 角色组件

每个需要逐物体阴影的角色根节点添加：

```text
PerObjectShadowProjector
```

每个需要 Shell 毛发惯性的对象添加：

```text
FurInertia
```

---

## 20. 最终效果组成

完成配置后，一个完整角色的最终画面由以下部分组成：

```mermaid
flowchart TD
    A[基础材质] --> B[皮肤 / 脸 / 头发 / 服装 / 眼睛]
    C[PerObjectShadow] --> D[角色自阴影]
    C --> E[环境投影阴影]
    E --> E1[ScreenSpaceShadowReceiver]
    F[GlobalEnvLightController] --> G[材质内边缘光]
    F --> G1[自阴影 / 环境阴影强度]
    F --> G2[可控 URP 附加光]
    H[DepthOffsetRimFeature] --> I[后处理边缘光]
    J[SmoothNormals UV2] --> K[稳定外描边]
    L[FaceDirection] --> M[脸部 SDF 阴影]
    L --> N[眼睛侧面渐隐]
    O[FurFeature] --> P[Shell 毛发]
    Q[FurInertia] --> P

    B --> R[最终角色画面]
    D --> R
    E1 --> R
    G --> R
    G1 --> R
    G2 --> R
    I --> R
    K --> R
    M --> R
    N --> R
    P --> R
```

---

## 21. 总结

当前终末地渲染还原工程的角色渲染方案是一套偏完整的 URP 二次元角色渲染管线：

- `PerObjectShadow` 负责高质量角色逐物体阴影，并通过屏幕空间贴图接入所有角色 Shader。
- `GlobalEnvLightController` 负责统一写入角色自阴影强度、环境接收阴影强度、材质内边缘光参数和受控 URP 附加光参数。
- `S_Char_Common.hlsl` 将屏幕阴影采样、阴影强度映射、附加光封装、边缘光、描边和 ShadowCaster 统一封装，减少各 Shader 重复代码。
- `S_Char_Body`、`S_Char_Face`、`S_Char_Hair`、`S_Char_Cloth`、`S_Char_Eye` 分别针对角色不同部位做了专用光照模型，并已接入受控附加光。
- `PerObjectShadow/ScreenSpaceShadowReceiver` 负责让环境物体接收角色逐物体屏幕空间阴影，并由 `_Global_EnvShadowStrength` 控制强度。
- `SmoothNormals` + `UV2` 提供稳定描边基础。
- `FaceDirection` 解决二次元脸部 SDF 阴影、头发高光参考和眼睛侧面渐隐的方向问题。
- `FurFeature` + `S_Char_Fur` + `FurInertia` 组成 Shell 毛发系统。
- `DepthOffsetRimFeature` 可作为额外的全屏边缘光补充。

实际制作时建议按以下顺序推进：

1. 模型切线和 `UV2` 平滑法线准备。
2. 材质分部位绑定对应 Shader。
3. 配置 `FaceDirection` 和 `GlobalEnvLightController`。
4. 添加 `PerObjectShadowFeature` 与 `PerObjectShadowProjector`。
5. 如需环境投影，给接收物体使用 `PerObjectShadow/ScreenSpaceShadowReceiver`。
6. 调通角色自阴影和环境接收阴影后，再调各部位材质。
7. 如需多光源，开启 URP Additional Lights 并通过 `GlobalEnvLightController` 控制。
8. 最后加入描边、边缘光、毛发和眼睛遮挡等细节。

这样可以先保证基础光影稳定，再逐步叠加风格化效果，避免多个系统同时调试导致问题难以定位。

最后在下面放点角色图片

![](CharPic/AKEKURI.png)
![](CharPic/ALESH.png)
![](CharPic/ANTAL.png)
![](CharPic/ARCLIGHT.png)
![](CharPic/ARDELIA.png)
![](CharPic/AVYWENNA.png)
![](CharPic/CATCHER.png)
![](CharPic/CHENQIANYU.png)
![](CharPic/DAPAN.png)
![](CharPic/EMBER.png)
![](CharPic/ESTELLA.png)
![](CharPic/FLUORITE.png)
![](CharPic/GILBERTA.png)
![](CharPic/LAEVATAIN.png)
![](CharPic/LASTRITE.png)
![](CharPic/LIFENG.png)
![](CharPic/PERLICA.png)
![](CharPic/POGRANICHNIK.png)
![](CharPic/SNOWSHINE.png)
![](CharPic/WULFGARD.png)
![](CharPic/XAIHI.png)
![](CharPic/YVONNE.png)