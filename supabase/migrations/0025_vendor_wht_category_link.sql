-- Replace the vendor's freeform WHT default fields (default_wht_category text,
-- default_wht_pct number — confirmed unused anywhere else in the app, and only ever
-- touched by one test vendor with empty values) with a proper FK to wht_categories,
-- so the vendor form can render a dropdown instead of free-typed text/rate.

alter table vendors
  add column default_wht_category_id uuid references wht_categories(id),
  drop column default_wht_category,
  drop column default_wht_pct;
