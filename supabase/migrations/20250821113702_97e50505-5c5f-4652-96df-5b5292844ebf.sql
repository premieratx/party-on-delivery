-- Update the customer flow to ensure proper post-checkout linkage
UPDATE customer_flows 
SET post_checkout_id = 'c46c5ff9-41e6-4d6c-b538-0dfd898498ed'
WHERE slug = 'i-love-boobs-flow' AND post_checkout_id IS NULL;