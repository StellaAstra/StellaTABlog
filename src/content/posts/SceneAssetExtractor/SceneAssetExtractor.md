---
title: Unity场景资产提取器 - 完整教程与代码分析
published: 2025-11-14
description: '方便日常项目资产的转移等功能的小工具'
image: './0.png'
tags: [小工具,Unity,场景提取]
category: '小工具'
draft: false
lang: 'zh_CN'
pinned: false
---

## 前言

最近在迁移老项目的资产但是不想一个个去手动寻找转移，同时想到工作中交接可能也会遇到资产交接，遂开发了这个工具，码了2k多行屎山，目前可能还有一些bug但基本满足我个人的使用了，打算开源分享

### 项目地址

::github{repo="StellaAstra/UnityTools"}

## 工具概述

Unity 场景资产提取器用于从当前场景中自动识别、分类和导出所有相关资产。这个工具能够解决开发者在项目整理、资产迁移和场景分析中遇到的常见问题。

### 主要功能亮点

- **自动资产识别**：智能分析场景中使用的所有资产
- **多格式导出**：支持文件夹复制和 UnityPackage 导出
- **智能分类**：按类型或自定义规则组织资产
- **HLSL 依赖追踪**：自动提取 Shader 引用的 HLSL 文件
- **地形资产支持**：专门处理 Terrain 和 TerrainData 资产
- **脚本识别**：准确识别 MonoScript 和自定义脚本

## 安装与使用

### 安装步骤

1. 将 `SceneAssetExtractor.unitypackage` 拖到unity项目中导入
2. 在 Unity 编辑器中打开菜单：`Tools/场景资产提取器`
3. 工具窗口将显示，可以开始使用

### 基本使用流程

```markdown
1. 打开需要提取资产的场景
2. 点击 "Tools/场景资产提取器" 打开工具窗口
3. 点击 "刷新资产列表" 扫描场景资产
4. 根据需要配置过滤器和导出选项
5. 选择导出方式并执行导出 
```

:::note

打包成Package文件是完全没有问题的他是保持原始文件夹结构打包的一次不会破坏文件之间的相对路径因此预制体与模型和材质之间的依赖关系不会被破坏，同理材质也是。

但是导出到文件夹并且选择按特定类型分类这回破坏原有的路径关系因此会出现材质与shader之间关联以及预制体与其他资产之间的关系破坏

:::

### 界面UI

![image](1.png)

![image](2.png)

## 核心功能详解

### 1. 资产识别系统

#### 资产收集机制

```csharp
private void ExtractSceneAssets()
{
    // 收集场景根对象的所有资产
    GameObject[] rootObjects = currentScene.GetRootGameObjects();
    HashSet<UnityEngine.Object> collectedObjects = new HashSet<UnityEngine.Object>();

    foreach (GameObject root in rootObjects)
    {
        CollectAssetsFromGameObject(root, collectedObjects);
    }
}
```

#### 特殊资产处理

- **预制体识别**：通过 `PrefabUtility` 识别预制体引用
- **脚本收集**：通过 `MonoScript.FromMonoBehaviour` 获取脚本资产
- **地形资产**：专门处理 Terrain 组件及相关数据
- **HLSL 文件**：解析 Shader 代码中的 `#include` 指令

### 2. HLSL 依赖追踪系统

#### 核心算法

```csharp
private void ExtractHLSLReferencesFromCode(string shaderCode, string sourceFilePath, HashSet<UnityEngine.Object> collectedObjects)
{
    // 使用正则表达式匹配 #include 指令
    Regex includeRegex = new Regex(@"#include\s*(?:<\s*([^>]+)\s*>|[""']\s*([^""']+)\s*[""'])", RegexOptions.Multiline | RegexOptions.IgnoreCase);
    MatchCollection matches = includeRegex.Matches(shaderCode);

    foreach (Match match in matches)
    {
        string includePath = match.Groups[1].Success ? match.Groups[1].Value : match.Groups[2].Value;
        ResolveAndAddHLSLFile(includePath, sourceDirectory, sourceFilePath, collectedObjects);
    }
}
```

#### 路径解析策略

1. **直接路径**：检查绝对路径是否存在
2. **相对路径**：基于 Shader 文件位置解析
3. **项目搜索**：在整个项目中搜索匹配文件
4. **递归解析**：继续解析 HLSL 文件中的嵌套引用

### 3. 智能导出系统

#### 导出路径计算

```csharp
private string GetDestinationPath(string baseFolder, AssetInfo asset, string sourcePath)
{
    string fileName = Path.GetFileName(sourcePath);

    if (preserveFolderStructure)
    {
        // 保持原始文件夹结构
        string relativePath = GetRelativeAssetPath(sourcePath);
        return Path.Combine(baseFolder, relativePath);
    }
    else if (exportBySpecificType)
    {
        // 按特定类型分类
        string typeFolder = GetSpecificTypeFolder(asset, sourcePath);
        return Path.Combine(baseFolder, typeFolder, fileName);
    }
    // ... 其他分类方式
}
```

#### 多位置 HLSL 导出

```csharp
// 为 HLSL 文件创建多个副本，满足不同 Shader 的路径要求
if (specificTypeSettings.createHLSLSymlinks && hlslUsageMap.ContainsKey(asset.Path))
{
    foreach (string shaderPath in hlslUsageMap[asset.Path])
    {
        string altDestPath = GetHLSLDestinationPathForShader(exportFolder, asset, asset.Path, shaderPath);
        // 为每个使用该 HLSL 的 Shader 创建对应路径的副本
    }
}
```

## 代码架构分析

### 1. 核心数据结构

#### AssetInfo 类

```csharp
[System.Serializable]
public class AssetInfo
{
    public UnityEngine.Object Object;    // Unity 对象引用
    public string Path;                  // 资产路径
    public System.Type Type;             // 资产类型
    public long FileSize;                // 文件大小
}
```

#### HLSL 引用映射

```csharp
public class HLSLReference
{
    public string hlslPath;      // HLSL 文件实际路径
    public string includePath;   // #include 指令中的路径
    public string shaderPath;    // 引用该文件的 Shader 路径
}
```

### 2. 主要组件模块

#### 用户界面系统

- **主窗口**：继承自 `EditorWindow`，提供完整的 GUI
- **折叠面板**：使用 `EditorGUILayout.Foldout` 组织界面
- **实时过滤**：基于搜索条件和类型过滤器的动态列表

#### 资产收集系统

- **递归遍历**：深度遍历场景层次结构
- **序列化分析**：通过 `SerializedObject` 分析组件属性
- **依赖追踪**：使用 `AssetDatabase.GetDependencies` 获取完整依赖链

#### 导出引擎

- **文件操作**：安全的文件复制和目录创建
- **元数据保护**：同时复制 `.meta` 文件
- **进度反馈**：使用 `EditorUtility.DisplayProgressBar` 显示进度

### 3. 关键算法实现

#### 资产类型识别

```csharp
private string GetDisplayType(AssetInfo asset)
{
    // 基于文件扩展名和实际类型进行智能识别
    if (asset.Path.ToLower().EndsWith(".prefab")) return "Prefab";
    if (IsHLSLFile(asset.Path)) return "HLSL";
    if (asset.Type.Name == "Terrain") return "Terrain";
    // ... 其他类型判断
}
```

#### URP 资产过滤

```csharp
private bool IsURPAsset(string assetPath)
{
    string[] urpKeywords = {
        "Packages/com.unity.render-pipelines.universal",
        "UniversalRenderPipelineAsset",
        // ... 其他 URP 标识
    };

    // 检查路径是否包含 URP 关键字
    return urpKeywords.Any(keyword => assetPath.ToLower().Contains(keyword.ToLower()));
}
```

## 高级功能配置

### 1. HLSL 提取配置

```csharp
// 在 SpecificTypeSettings 中配置 HLSL 行为
public bool extractShaderIncludes = true;           // 是否提取 Shader 引用
public bool preserveHLSLFolderStructure = true;     // 保持 #include 路径结构
public bool createHLSLSymlinks = false;             // 为多引用创建副本
public bool excludeURPAssets = true;                // 排除 URP 内置资产
```

### 2. 地形资产处理

```csharp
private void CollectTerrainAssets(HashSet<UnityEngine.Object> collectedObjects)
{
    Terrain[] terrains = UnityEngine.Object.FindObjectsOfType<Terrain>();
    foreach (Terrain terrain in terrains)
    {
        collectedObjects.Add(terrain);
        if (terrain.terrainData != null)
        {
            collectedObjects.Add(terrain.terrainData);
            // 收集地形相关的材质、纹理、细节资源等
        }
    }
}
```

### 3. 脚本资产识别

```csharp
private void CollectScriptAssets(HashSet<UnityEngine.Object> collectedObjects)
{
    // 通过 MonoBehaviour 组件收集脚本
    MonoBehaviour[] monoBehaviours = UnityEngine.Object.FindObjectsOfType<MonoBehaviour>();
    foreach (MonoBehaviour mb in monoBehaviours)
    {
        MonoScript monoScript = MonoScript.FromMonoBehaviour(mb);
        if (monoScript != null)
        {
            collectedObjects.Add(monoScript);
        }
    }
}
```

## 使用场景与最佳实践

### 1. 项目迁移

当需要将场景及其依赖资产迁移到新项目时：

- 使用 "导出Unity包" 功能创建完整的资产包
- 启用 "排除URP资产" 避免包含渲染管线特定资源
- 使用报告功能检查导出的资产列表

### 2. 资产清理

识别场景中未使用的资产：

- 导出场景使用的所有资产
- 与项目资产库对比找出未使用的资源
- 使用类型过滤专注于特定类型的资产

### 3. 渲染管线迁移

从 Built-in 迁移到 URP：

- 导出所有材质和 Shader
- 使用 HLSL 提取功能获取自定义 Shader 代码
- 排除 URP 内置资产避免冲突

### 4. 团队协作

分享特定场景的资产：

- 创建包含所有依赖的 UnityPackage
- 生成详细的资产报告供团队成员参考
- 使用自定义文件夹结构保持组织性

## 故障排除

### 常见问题

#### 1. HLSL 文件路径问题

**症状**：导出的 HLSL 文件路径不正确 **解决方案**：

- 启用 "多位置副本" 选项
- 使用 "分析路径问题" 功能诊断
- 检查 Shader 中的 `#include` 路径

#### 2. 脚本识别失败

**症状**：MonoScript 资产未被正确识别 **解决方案**：

- 使用 "调试脚本" 功能检查识别过程
- 确保脚本文件存在于项目中
- 检查资产类型过滤器设置

#### 3. 预制体引用缺失

**症状**：预制体实例未被识别为预制体资产 **解决方案**：

- 使用 "调试预制体" 功能
- 检查 `PrefabUtility` 相关代码
- 确保预制体已保存到项目中

### 调试工具

工具内置了多个调试功能：

- **调试预制体**：显示预制体识别详情
- **调试脚本**：分析脚本收集过程
- **测试HLSL提取**：单独测试 Shader 解析
- **查看HLSL映射**：显示 Shader 与 HLSL 的引用关系

## 性能优化建议

### 1. 大型场景处理

- 分批处理资产，避免一次性处理过多资源
- 使用进度条显示长时间操作的状态
- 考虑禁用子资产收集以减少处理时间

### 2. 内存管理

- 使用 `HashSet<UnityEngine.Object>` 避免重复收集
- 及时清理临时集合和缓存
- 使用 `EditorUtility.UnloadUnusedAssets` 释放内存

### 3. 文件操作优化

- 批量文件操作减少 IO 开销
- 使用缓存机制避免重复路径计算
- 异步操作处理大量文件导出

## 扩展与自定义

### 添加新的资产类型

```csharp
// 1. 在 GetDisplayType 中添加类型识别
case "YourCustomType":
    return specificTypeSettings.yourCustomType ? specificTypeSettings.yourCustomFolder : null;

// 2. 在 SpecificTypeSettings 中添加配置项
public bool yourCustomType = true;
public string yourCustomFolder = "YourCustom";

// 3. 添加专用的收集方法
private void CollectYourCustomAssets(HashSet<UnityEngine.Object> collectedObjects)
{
    // 实现自定义资产的收集逻辑
}
```

### 自定义导出逻辑

重写 `GetDestinationPath` 方法实现自定义的文件组织结构：

```csharp
protected virtual string GetDestinationPath(string baseFolder, AssetInfo asset, string sourcePath)
{
    // 实现自定义的路径计算逻辑
    return customPath;
}
```

## 总结

感谢你看到这里该工具主要是由于我个人需求所产生并扩展的，它能够基本满足我的日常项目资产的转移，同时还能清理无效资产、材质、脚本和shader等，并且也能够打包成package文件方便与项目成员对接。这个工具可以一定程度上解决实际的开发需求无论是用于项目迁移、资产清理还是团队协作，都是非常不错的。

### 后续更新（有需求的话会更新同时也会修复一些bug）
