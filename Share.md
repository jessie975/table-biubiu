# Table-Demo技术分享

## 实现的功能

* 创建表格
* 插入行列
* 删除行列
* 合并单元格
* 选择单元格
* 封装菜单组件

## 主要功能讲解

* 插入
* 合并
* 选择

### 关于插入

主要思想：  
  不包含合并项的插入就是简单的操作数组，包含合并项的插入：
![insert](http://chuantu.xyz/t6/702/1565779532x3703728804.png)

### 关于合并

主要思想：  
  找到**选中的区域**的最左上角的单元格，将其属性rowspan、colspan设置成相应的值,让其他选中区域的单元格不渲染。
![merge](http://chuantu.xyz/t6/702/1565779637x989559068.png)

### 关于选中

主要思想：
  记录鼠标点击和鼠标释放的两个点，找到两点间XY的最大最小值，循环遍历数组，如果单元格的XY坐标在最大最小值区间则将其高亮，watch监听移动的坐标，坐标变化则重新生成带有高亮的table表格。
  
  重点：包含合并单元格的最大最小值确定。
  判断被合并的单元格的XY是否在两个鼠标事件的XY之间，若在则说明经过了合并的单元格，找到合并单元格的左上角即包含合并的最小XY（合并单元格的XY）和右下角坐标即包含合并的最大XY（X=合并单元格的X+rowspan，Y=合并单元格的Y+colspan），最后再用之前的最大最小XY和此时的最大最小XY做对比，选出真正的最大最小值。

## codeReview

期待各位老师们的指导意见~