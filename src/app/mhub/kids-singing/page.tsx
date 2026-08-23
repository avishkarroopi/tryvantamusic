import { redirect } from "next/navigation";

// The recovered SingleFile capture for this content's URL comment reads
// "/mhub/vocal-training", not "/mhub/kids-singing" (see mhub.har + the
// capture's own header). This redirect exists only so the route name
// originally requested still resolves, without duplicating page content.
export default function KidsSingingRedirect() {
  redirect("/mhub/vocal-training");
}
