#!/usr/bin/env python3
"""
GCP Dataproc PySpark ETL Pipeline Template
-----------------------------------------
This script demonstrates a standard production-grade PySpark ETL pipeline
running on GCP Dataproc that:
1. Reads raw source data (e.g., CSV leads) from Google Cloud Storage (GCS).
2. Cleans, standardizes, and validates the data (handling dates, nulls, and formats).
3. Writes the processed dataset into a Google BigQuery table using the connector.

Execution on Dataproc:
gcloud dataproc jobs submit pyspark scripts/gcp_dataproc_bigquery_etl.py \
    --cluster=<CLUSTER_NAME> \
    --region=<REGION> \
    --jars=gs://spark-lib/bigquery/spark-3.5-bigquery-0.36.0.jar
"""

import sys
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, trim, lower, upper, when, to_timestamp, regexp_replace, lit

def main():
    # 1. Initialize SparkSession (Dataproc automatically configures this,
    # but defining it here ensures local test compatibility)
    spark = SparkSession.builder \
        .appName("GCP-Dataproc-BigQuery-ETL") \
        .getOrCreate()

    # Define GCS inputs and BigQuery outputs (replace with actual values)
    PROJECT_ID = "hubi666hubi-wfp-crm" # GCP Project ID
    INPUT_GCS_PATH = "gs://wfp-leads-lake/raw/leads_input.csv"
    STAGING_GCS_BUCKET = "wfp-leads-lake-temp-bucket"
    OUTPUT_BQ_TABLE = f"{PROJECT_ID}.wfp_crm.leads_clean"

    print("=" * 60)
    print(f"Starting ETL Pipeline: {INPUT_GCS_PATH} -> {OUTPUT_BQ_TABLE}")
    print("=" * 60)

    try:
        # 2. READ: Load raw CSV data from GCS
        # Always use header=True and inferSchema=True for CSVs to avoid all-string columns
        print("[READ] Reading raw CSV from GCS...")
        raw_df = spark.read \
            .option("header", "true") \
            .option("inferSchema", "true") \
            .csv(INPUT_GCS_PATH)

        print("Original Schema:")
        raw_df.printSchema()

        # 3. TRANSFORM: Clean, sanitize, and validate
        print("[TRANSFORM] Sanitizing and standardizing columns...")
        
        # Standardize strings, clean whitespaces, and validate formatting
        processed_df = raw_df \
            .withColumn("company_name", trim(col("company_name"))) \
            .withColumn("email", lower(trim(col("email")))) \
            .withColumn("qualification_score", 
                        when(col("qualification_score").isNull(), 0.0)
                        .otherwise(col("qualification_score").cast("double"))) \
            .withColumn("source", 
                        when(col("source").isNull(), "UNKNOWN")
                        .otherwise(upper(trim(col("source"))))) \
            .withColumn("phone", regexp_replace(col("phone"), r"[\s\-\(\)]", "")) # Remove spaces, dashes, parens
            
        # Parse timestamps safely if a date column exists (e.g., 'created_at' in YYYY-MM-DD HH:MM:SS)
        if "created_at" in raw_df.columns:
            processed_df = processed_df.withColumn(
                "created_at", 
                to_timestamp(col("created_at"), "yyyy-MM-dd HH:mm:ss")
            )
        else:
            processed_df = processed_df.withColumn("created_at", to_timestamp(lit("2026-07-13 12:00:00")))

        # Filter out rows with completely invalid emails
        processed_df = processed_df.filter(
            col("email").contains("@") & col("email").contains(".")
        )

        print("Processed Schema:")
        processed_df.printSchema()

        # 4. WRITE: Load the cleaned DataFrame into BigQuery
        # We use indirect write (write via GCS temporary bucket) which is optimal for large/partitioned tables
        print(f"[WRITE] Loading processed DataFrame into BigQuery table: {OUTPUT_BQ_TABLE}")
        processed_df.write \
            .format("bigquery") \
            .option("table", OUTPUT_BQ_TABLE) \
            .option("temporaryGcsBucket", STAGING_GCS_BUCKET) \
            .option("writeMethod", "indirect") \
            .mode("overwrite") \
            .save()

        print("=" * 60)
        print("ETL Pipeline completed successfully! [SUCCESS]")
        print("=" * 60)

    except Exception as e:
        print(f"ETL Pipeline failed with error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
