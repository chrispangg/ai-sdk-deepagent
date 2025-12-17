---
name: data-analysis
description: Analyze CSV and tabular data, create summaries, and generate insights
---

# Data Analysis Skill

This skill provides step-by-step workflows for analyzing tabular data (CSV, TSV, etc.).

## When to Use This Skill

Use this skill when the user:
- Wants to analyze CSV or tabular data
- Needs data summaries or statistics
- Asks for insights from datasets
- Wants to parse structured data files

## Workflow

### 1. Understand the Data Source

First, determine where the data is:
- Is it in a file? Get the file path
- Is it provided inline? Store it in the filesystem first
- Does it need to be fetched? Use appropriate tools

### 2. Read and Parse the Data

Use `read_file` to load the data. Look for:
- Column headers (first row usually)
- Data types in each column
- Missing or null values
- Data format (CSV, TSV, etc.)

### 3. Analyze the Data

Perform these analyses based on user needs:

**Basic Statistics:**
- Row count
- Column count
- Value ranges (min, max)
- Missing value counts

**Data Quality:**
- Check for duplicates
- Identify anomalies
- Validate data types

**Insights:**
- Trends or patterns
- Correlations
- Key findings

### 4. Create Summary Report

Structure your summary as:

```
# Data Analysis Report

## Dataset Overview
- Rows: [count]
- Columns: [count]
- Columns: [list]

## Key Statistics
[Relevant statistics based on data type]

## Data Quality
[Any issues found]

## Insights
[Key findings and patterns]

## Recommendations
[Suggested next steps]
```

## Example

**User request:** "Analyze this sales data: sales.csv"

**Your approach:**
1. Read sales.csv using read_file
2. Parse the CSV structure (headers, data types)
3. Calculate: total sales, average order value, top products
4. Check for: missing data, date ranges, outliers
5. Generate summary report with insights

## Best Practices

- Always validate data before analysis
- Handle missing values gracefully
- Provide context for statistics (what do they mean?)
- Suggest visualizations when appropriate
- Ask clarifying questions if data structure is unclear
