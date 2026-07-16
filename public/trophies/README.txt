Drop trophy artwork here as /trophies/{id}.png (square, ~1024x1024, compressed to ~150–250KB).
The app looks up each trophy's image by its id; any trophy without a file gracefully falls back to
the tier-icon treatment, so the app ships complete before art exists. Images are lazy-loaded.

IMPORTANT: name files by these EXACT ids from the code (they differ from the v7 brief's PART 5 table —
e.g. it says steady8/fuel7/scales7/cheese and lists comeback/explorer, none of which exist here):

first  w10  w25  w50  w100  streak4  streak8  t10k  t100k  t1m  sets1000
pr1  pr10  pr25  bench100  squat140  dead180  dawn  night  full
food1  food7  food30  protein25  food250
weigh1  weighstreak7  weighstreak30  weigh100  weigh200
photo1  photo2  photo10  photo25  plat
