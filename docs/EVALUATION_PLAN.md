# Evaluation Plan — Foundation MVP

The Foundation MVP stores and displays events; it has no correlation algorithm. It makes no precision, recall, false-correlation, incident-grouping, or analyst-productivity claim.

The synthetic fixture is intended only to exercise ingestion, filtering, and presentation. It is not ground truth and must not be used to tune or claim detection quality.

Before evaluating correlation, define a separate dataset manifest and independently authored event/edge/incident ground truth. Freeze the rule version and dataset split before evaluation. At minimum, report pairwise precision, recall, F1, false-correlation rate, missed-correlation rate, incident grouping metrics, and error cases. Keep independent-alert, deterministic rule, and candidate advanced methods on the same data and definitions. Store source revision, dataset manifest, ground-truth version, rule/config versions, run time, metrics, and output artifacts per run.

