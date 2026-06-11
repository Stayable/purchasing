# Demo Data Manifest — Procurement portal QA (06/12/26)

Synthetic demo records created via MCP to populate the `/review` portal for visual QA.
**All are tagged for cleanup:** Vendors carry `Vendor_Notes = "DEMO 061226"`; Procurement_Items carry `Description = "DEMO 061226"`. Quotes are reachable via their `Procurement_Item` link.

**Deletion is UI-only** (no MCP delete tool). Before any real-data go-live, delete all records below (plus the older `_DELETE`/`Test` records: `Exterior Door`, `Exit Signs (Test)`, `TEST_QueenMattress_DELETE` + its 3 quotes + the 3 `TEST_Vendor*_DELETE` vendors). Easiest path: in each module, build a list view filtered on the tag, select all, delete.

## Vendors (10) — module `Vendors`, filter `Vendor_Notes = DEMO 061226`
| Name | ID |
|---|---|
| Ningbo Aux Imp & Exp Co | 6342912000001542002 |
| Gree Electric Appliances | 6342912000001542003 |
| Midea Group | 6342912000001542004 |
| Zhejiang Walrus Flooring | 6342912000001542005 |
| Foshan Nanhai Door Industry | 6342912000001542006 |
| Guangdong Lumina Lighting | 6342912000001542007 |
| Jiangsu SweetDream Bedding | 6342912000001542008 |
| Hangzhou HomeTextile Co | 6342912000001542009 |
| Suzhou BathWorks Hardware | 6342912000001542010 |
| Binh Duong Timber Co | 6342912000001542011 |

## Procurement_Items (10) — module `Procurement_Items`, filter `Description = DEMO 061226`
| Name | Stage | ID | Awarded quote |
|---|---|---|---|
| PTAC Units 9000BTU | Submitted | 6342912000001543001 | 546003 (Midea) |
| Queen Mattresses | Submitted | 6342912000001543002 | 546005 (HomeTextile) |
| Vinyl Plank Flooring | Submitted | 6342912000001543003 | 546008 (Binh Duong) |
| Mini-Split 23000BTU | Bid | 6342912000001543004 | — |
| Exterior Steel Doors | Level | 6342912000001543005 | — |
| LED Area Lighting | FL-Validate | 6342912000001543006 | — |
| Bath Hardware Sets | Recommend | 6342912000001543007 | 546017 (BathWorks) |
| Bath Towels 600GSM | Approved | 6342912000001543008 | 546020 (HomeTextile) |
| Pressure Washers 4400PSI | Declined | 6342912000001543009 | — |
| Dressers Case Goods | Approved-with-Conditions | 6342912000001543010 | 546025 (Binh Duong) |

## Vendor_Quotes (27) — module `Vendor_Quotes`
IDs `6342912000001546001` … `6342912000001546027` (sequential). Landed cost is the `Landed_Cost_Unit`/`Total_Landed_Cost` formula = `Unit_Price + (Freight_Cost + Duty_Tariff) / Order_Quantity`.
