---
title: mhy游戏资源查询更新小工具-fuck_mhy.py
published: 2025-10-22
description: '拆分json文件并对比上版本json文件浏览增加内容'
image: './00.jpg'
tags: [小工具,ZZZ,解包]
category: '小工具'
draft: false
lang: 'zh_CN'
pinned: false
---

:::warning
本文并不会针对解包方法方面有跟深入的讲解，主要是处理解包后的文件以json文件为例，旨在方便知道相较于上个版本更新了什么，方便快速定位新内容
:::

:::note
技术栈：Python
:::

## 好了话不多说接下来我们开始

## 资源准备

两个json文件我这边以ZZZ2.1和ZZZ2.4为例下面是其存储格式

```json
"GameType": "ZZZ",
  "AssetEntries": [
    {
      "Name": "Sprites-Default",
      "Container": "",
      "Source": "F:\\miHoYo Launcher\\games\\ZenlessZoneZero Game\\ZenlessZoneZero_Data\\globalgamemanagers",
      "PathID": 2,
      "Type": "Material",
      "SHA256Hash": "eea3d1c0d0470ac2b31bfb22d6cf280832e8b12bddecf2ddb8eac643c4f31549"
    },
    {
      "Name": "Decal",
      "Container": "",
      "Source": "F:\\miHoYo Launcher\\games\\ZenlessZoneZero Game\\ZenlessZoneZero_Data\\globalgamemanagers",
      "PathID": 3,
      "Type": "Material",
      "SHA256Hash": "3e095bb1e5b21c95388579174aba175ef5308e55136b49e2e2bdd20d
1e13d59e"
    },
·····
```

## 功能实现

### 使用python创建简单表格

计算每列的最大宽度并增加两个空格

```python
col_widths = []
for i in range(len(headers)):
    max_width = len(headers[i])
    for row in data:
        if i < len(row):
           max_width = max(max_width, len(str(row[i])))
    col_widths.append(max_width + 2) i])))
```

构建表格并且添加表头

```python
# 构建表格
table = []
table.append(separator)

# 添加表头
header_row = "|"
for i, header in enumerate(headers):
    header_row += f" {header:<{col_widths[i]-2}} |"
table.append(header_row)
table.append(separator)
```

添加数据行

```python
for row in data:
    data_row = "|"
    for i, cell in enumerate(row):
        data_row += f" {str(cell):<{col_widths[i]-2}} |"
    table.append(data_row)
table.append(separator)
return "\n".join(table)
```

### 模糊查询

简单的模糊搜索函数  ，将搜索模式转换为正则表达式进行匹配，例如 "spr def" 转换为 ".*spr.*def.*"

```python
regex_pattern = '.*' + '.*'.join(re.escape(part) for part in pattern.split()) + '.*'
return re.search(regex_pattern, text, re.IGNORECASE) is not None
```

### 条件查询

解析搜索查询，识别name和type条件

支持以下格式：  

- "name:xxx" - 只搜索名称  
- "type:xxx" - 只搜索类型  
- "xxx" - 同时搜索名称和类型  
- "name:xxx type:yyy" - 组合搜索

拆分查询条件代码

```python
parts = query.split()

for part in parts:
    if part.lower().startswith("name:"):
         name_pattern = part[5:]
    elif part.lower().startswith("type:"):
         type_pattern = part[5:]
    else:
         general_pattern += " " + part

general_pattern = general_pattern.strip()
```

如果没有指定特定条件，则使用通用模式

### 显示资产列表

解析搜索查询

```python
name_pattern, type_pattern = parse_search_query(search_query)
```

使用解析后的条件过滤资产并且只有当所指定的条件都匹配时才会包括该资产

```python
filtered_assets = []
for asset in asset_entries:
    name_match = fuzzy_search(name_pattern, asset.get('Name', ''))
    type_match = fuzzy_search(type_pattern, asset.get('Type', ''))

if name_match and type_match:
    filtered_assets.append(asset)
```

接下来准备表格数据并输出搜索条件信息

```python
for asset in filtered_assets:
    table_data.append([
        asset.get('Name', ''),
        asset.get('Type', '')
    ])

headers = ["名称", "类型"]

condition_info = []
if name_pattern:
    condition_info.append(f"名称包含: '{name_pattern}'")
if type_pattern:
    condition_info.append(f"类型包含: '{type_pattern}'")

condition_str = " 且 ".join(condition_info) if condition_info else "所有字段"

print(f"搜索条件: {condition_str}")
print(f"找到 {len(filtered_assets)} 个匹配项:")
print(create_simple_table(table_data, headers))
```

### 比较Json文件并找出新增的Asset

文件读取部分代码我会在下面讲解这边我们直接快进到核心代码

主要逻辑就是读取新旧json文件的数据并提取AssetEntries数组，然后创建就资产的哈希值集合，用于快速查询，然后找出新增的资产（在新文件中不在就文件中）

直接上代码

```python
old_assets = old_data.get("AssetEntries", [])
new_assets = new_data.get("AssetEntries", [])

old_hashes = {asset.get('SHA256Hash', '') for asset in old_assets}

added_assets = []
for asset in new_assets:
    if asset.get('SHA256Hash', '') not in old_hashes:
        added_assets.append(asset)

return added_assets
```

### 文件读取

读取json文件并提取AssetEntries数组

```python
with open(json_file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

asset_entries = data.get("AssetEntries", [])
```

### 交互式搜索循环

用于单json或新旧json文件对比后增加的内容搜索

```python
while True:
    print("\n" + "="*50)
    search_query = input("请输入搜索查询: ").strip()

    if search_query.lower() in ['quit', 'exit', 'q']:
        print("程序已退出")
        break
    elif search_query.lower() == 'help':
        show_help()
    elif search_query == "":
        # 显示所有资产
        display_assets_with_search(asset_entries, "")
    else:
        # 执行搜索
        display_assets_with_search(asset_entries, search_query)
```

### 菜单功能

这就更简单了print就行了

```python
print("\n=== 搜索帮助 ===")
print("1. 通用搜索: 输入任意关键词，会在名称和类型中同时搜索")
print("   示例: sprite")
print("2. 按名称搜索: 使用 'name:关键词' 格式")
print("   示例: name:default")
print("3. 按类型搜索: 使用 'type:关键词' 格式")
print("   示例: type:material")
print("4. 组合搜索: 可以同时指定名称和类型条件")
print("   示例: name:sprite type:material")
print("5. 显示所有: 直接按回车")
print("6. 退出程序: 输入 'quit', 'exit' 或 'q'")
print("=" * 50)
```

至此所有功能均已讲述完成！

:::important

碎碎念：为什么会做这个是因为找叶瞬光模型找了半年实在想不到它的模型命名是什么，我只能说给zzz命名的人也是个天才我也是找了半天才找到的效率太慢了还是写个工具一劳永逸

:::

好了下面是效果和完整的代码，我对你们还是太好了代码都已经补上注释

![](C:\Users\Administrator\AppData\Roaming\marktext\images\2025-10-22-14-33-07-image.png)

![](C:\Users\Administrator\AppData\Roaming\marktext\images\2025-10-22-14-37-42-image.png)

![](C:\Users\Administrator\AppData\Roaming\marktext\images\2025-10-22-14-39-27-image.png)

![](C:\Users\Administrator\AppData\Roaming\marktext\images\2025-10-22-14-40-30-image.png)

## 完整代码

```python
import json
import os
import re

def create_simple_table(data, headers):
    """
    使用纯Python创建简单的表格
    """
    if not data:
        return "没有匹配的数据"

    # 计算每列的最大宽度
    col_widths = []
    for i in range(len(headers)):
        max_width = len(headers[i])
        for row in data:
            if i < len(row):
                max_width = max(max_width, len(str(row[i])))
        col_widths.append(max_width + 2)  # 添加一些填充

    # 创建分隔线
    separator = "+" + "+".join("-" * width for width in col_widths) + "+"

    # 构建表格
    table = []
    table.append(separator)

    # 添加表头
    header_row = "|"
    for i, header in enumerate(headers):
        header_row += f" {header:<{col_widths[i]-2}} |"
    table.append(header_row)
    table.append(separator)

    # 添加数据行
    for row in data:
        data_row = "|"
        for i, cell in enumerate(row):
            data_row += f" {str(cell):<{col_widths[i]-2}} |"
        table.append(data_row)

    table.append(separator)
    return "\n".join(table)

def parse_search_query(query):
    """
    解析搜索查询，识别name和type条件
    支持以下格式：
    - "name:xxx" - 只搜索名称
    - "type:xxx" - 只搜索类型
    - "xxx" - 同时搜索名称和类型
    - "name:xxx type:yyy" - 组合搜索
    """
    name_pattern = ""
    type_pattern = ""
    general_pattern = ""

    # 拆分查询条件
    parts = query.split()

    for part in parts:
        if part.lower().startswith("name:"):
            name_pattern = part[5:]  # 去掉"name:"前缀
        elif part.lower().startswith("type:"):
            type_pattern = part[5:]  # 去掉"type:"前缀
        else:
            general_pattern += " " + part

    general_pattern = general_pattern.strip()

    # 如果没有指定特定条件，使用通用模式
    if not name_pattern and not type_pattern and general_pattern:
        name_pattern = general_pattern
        type_pattern = general_pattern

    return name_pattern, type_pattern

def fuzzy_search(pattern, text):
    """
    简单的模糊搜索函数
    将搜索模式转换为正则表达式进行匹配
    """
    # 将搜索模式转换为正则表达式
    # 例如 "spr def" 转换为 ".*spr.*def.*"
    regex_pattern = '.*' + '.*'.join(re.escape(part) for part in pattern.split()) + '.*'
    return re.search(regex_pattern, text, re.IGNORECASE) is not None

def display_assets_with_search(asset_entries, search_query):
    """
    显示资产列表，支持模糊搜索
    """

    # 解析搜索查询
    name_pattern, type_pattern = parse_search_query(search_query)

    # 准备表格数据
    table_data = []

    # 使用解析后的条件过滤资产
    filtered_assets = []
    for asset in asset_entries:
        name_match = fuzzy_search(name_pattern, asset.get('Name', ''))
        type_match = fuzzy_search(type_pattern, asset.get('Type', ''))

        # 只有当所有指定条件都匹配时才包括该资产
        if name_match and type_match:
            filtered_assets.append(asset)

    # 准备表格数据
    for asset in filtered_assets:
        table_data.append([
            asset.get('Name', ''),
            asset.get('Type', '')
        ])

    # 定义表头
    headers = ["名称", "类型"]

    # 输出搜索条件信息
    condition_info = []
    if name_pattern:
        condition_info.append(f"名称包含: '{name_pattern}'")
    if type_pattern:
        condition_info.append(f"类型包含: '{type_pattern}'")

    condition_str = " 且 ".join(condition_info) if condition_info else "所有字段"

    print(f"搜索条件: {condition_str}")
    print(f"找到 {len(filtered_assets)} 个匹配项:")
    print(create_simple_table(table_data, headers))

def show_help():
    """
    显示帮助信息
    """
    print("\n=== 搜索帮助 ===")
    print("1. 通用搜索: 输入任意关键词，会在名称和类型中同时搜索")
    print("   示例: sprite")
    print("2. 按名称搜索: 使用 'name:关键词' 格式")
    print("   示例: name:default")
    print("3. 按类型搜索: 使用 'type:关键词' 格式")
    print("   示例: type:material")
    print("4. 组合搜索: 可以同时指定名称和类型条件")
    print("   示例: name:sprite type:material")
    print("5. 显示所有: 直接按回车")
    print("6. 退出程序: 输入 'quit', 'exit' 或 'q'")
    print("=" * 50)

def compare_json_files(old_file_path, new_file_path):
    """
    比较两个JSON文件，找出新增的AssetEntries
    """
    try:
        # 检查文件是否存在
        if not os.path.exists(old_file_path):
            print(f"错误: 旧文件 {old_file_path} 不存在")
            return None
        if not os.path.exists(new_file_path):
            print(f"错误: 新文件 {new_file_path} 不存在")
            return None

        # 读取旧JSON文件
        with open(old_file_path, 'r', encoding='utf-8') as file:
            old_data = json.load(file)

        # 读取新JSON文件
        with open(new_file_path, 'r', encoding='utf-8') as file:
            new_data = json.load(file)

        # 提取AssetEntries数组
        old_assets = old_data.get("AssetEntries", [])
        new_assets = new_data.get("AssetEntries", [])

        # 创建旧资产的哈希值集合，用于快速查找
        old_hashes = {asset.get('SHA256Hash', '') for asset in old_assets}

        # 找出新增的资产（在新文件中但不在旧文件中）
        added_assets = []
        for asset in new_assets:
            if asset.get('SHA256Hash', '') not in old_hashes:
                added_assets.append(asset)

        return added_assets

    except json.JSONDecodeError:
        print(f"错误: JSON文件格式不正确")
        return None
    except Exception as e:
        print(f"比较文件时发生错误: {e}")
        return None

def read_and_search_assets(json_file_path):
    """
    从JSON文件读取数据并支持搜索功能
    """
    try:
        # 检查文件是否存在
        if not os.path.exists(json_file_path):
            print(f"错误: 文件 {json_file_path} 不存在")
            return

        # 读取JSON文件
        with open(json_file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        # 提取AssetEntries数组
        asset_entries = data.get("AssetEntries", [])

        if not asset_entries:
            print("没有找到AssetEntries数据")
            return

        print(f"游戏类型: {data.get('GameType', '未知')}")
        print(f"资源总数: {len(asset_entries)}")
        print("\n输入 'help' 查看搜索帮助，输入 'quit' 或 'exit' 退出程序")

        # 交互式搜索循环
        while True:
            print("\n" + "="*50)
            search_query = input("请输入搜索查询: ").strip()

            if search_query.lower() in ['quit', 'exit', 'q']:
                print("程序已退出")
                break
            elif search_query.lower() == 'help':
                show_help()
            elif search_query == "":
                # 显示所有资产
                display_assets_with_search(asset_entries, "")
            else:
                # 执行搜索
                display_assets_with_search(asset_entries, search_query)

    except json.JSONDecodeError:
        print(f"错误: {json_file_path} 不是有效的JSON文件")
    except Exception as e:
        print(f"处理文件时发生错误: {e}")

def compare_and_search_assets(old_json_file_path, new_json_file_path):
    """
    比较两个JSON文件并搜索新增的AssetEntries
    """
    # 比较两个JSON文件，获取新增的资产
    added_assets = compare_json_files(old_json_file_path, new_json_file_path)

    if added_assets is None:
        return

    print(f"新增资源数量: {len(added_assets)}")

    if len(added_assets) == 0:
        print("没有发现新增资源")
        return

    print("\n输入 'help' 查看搜索帮助，输入 'quit' 或 'exit' 退出程序")

    # 交互式搜索循环
    while True:
        print("\n" + "="*50)
        search_query = input("请输入搜索查询: ").strip()

        if search_query.lower() in ['quit', 'exit', 'q']:
            print("程序已退出")
            break
        elif search_query.lower() == 'help':
            show_help()
        elif search_query == "":
            # 显示所有新增资产
            display_assets_with_search(added_assets, "")
        else:
            # 执行搜索
            display_assets_with_search(added_assets, search_query)

def show_main_menu():
    """
    显示主菜单
    """
    print("\n=== 主菜单 ===")
    print("1. 搜索单个JSON文件")
    print("2. 比较两个JSON文件并搜索新增内容")
    print("3. 退出程序")
    print("=" * 50)

# 使用示例
if __name__ == "__main__":
    # 主程序循环
    while True:
        show_main_menu()
        choice = input("请选择功能 (1-3): ").strip()

        if choice == '1':
            # 单个文件搜索模式
            json_file_path = input("请输入JSON文件路径: ").strip()
            if not os.path.exists(json_file_path):
                print(f"错误: 文件 {json_file_path} 不存在")
            else:
                read_and_search_assets(json_file_path)
        elif choice == '2':
            # 比较两个文件并搜索新增内容
            old_json_file_path = input("请输入旧JSON文件路径: ").strip()
            new_json_file_path = input("请输入新JSON文件路径: ").strip()
            compare_and_search_assets(old_json_file_path, new_json_file_path)
        elif choice == '3' or choice.lower() in ['quit', 'exit', 'q']:
            print("程序已退出")
            break
        else:
            print("无效选择，请重新输入")
```
