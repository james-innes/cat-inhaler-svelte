<script>
	import { onMount } from "svelte";
	import { payments } from "@square/web-sdk";

	let card, apple, google, sucess, process, phone;

	$: product = {
		name: "Cat Inhaler",
		price: 1000,
		qty: 0,
	};

	$: total = product.price * product.qty;

	$: onMount(async () => {
		let square = await payments("SQUARE_APP", "SQUARE_LOCATION");
		let request = square.paymentRequest({
			countryCode: "GB",
			currencyCode: "GBP",
			requestBillingContact: true,
			total: {
				amount: String((total / 100).toFixed(2)),
				label: "Total",
			},
		});

		window.ApplePaySession && (apple = await square.applePay(request));
		card = await square.card();
		await card.attach("#card");
		google = await square.googlePay(request);
		await google.attach("#google-pay");
	});

	async function pay(e, method) {
		e.preventDefault();
		process = true;
		let payment = await method.tokenize();

		console.log(payment);

		let r = await fetch("/.netlify/functions/checkout", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				token: payment.token,
				phone:
					"+44" +
					(phone
						? phone
						: payment.details?.card?.billing?.phone ||
						  payment.details?.shipping?.contact?.phone
					)
						.replace(/\s+/g, "")
						.slice(-10),
				product,
				total,
			}),
		});

		if (r.status == 201) {
			sucess = true;
			product.qty = 0;
		} else {
			process = false;
			alert("Failed to process order.");
		}
	}
</script>

<h1>Cat Inhaler 🐈</h1>

<p>Sold from England. High quantity stuff.</p>

<br />

<div class="gallery">
	<img src="1.jpg" alt="Cat Inhaler with Cat" />
	<img src="2.jpg" alt="Cat Inhaler side view" />
	<img src="3.jpg" alt="Cat Inhaler with diagram" />
</div>

<p style="font-size: 1.5rem">
	Each: {"£" + product.price / 100}<br />
	Total: £{(total / 100).toFixed(2)}
</p>

<select bind:value={product.qty}>
	{#each Array(6) as _, i}
		<option value={i}>&#215; {i}</option>
	{/each}
</select>
<br />
{#if sucess}
	<blockquote>
		<p>Your order was proccseed successfully.</p>
	</blockquote>
{:else if window.ApplePaySession}
	<apple-pay-button on:click={e => pay(e, apple)} />
{:else}
	<div
		id="google-pay"
		on:click={e => pay(e, google)}
		style="width: min-content"
	/>
	<h3>Pay by Card</h3>
	<form on:submit={e => pay(e, card)} style="max-width: 20rem">
		<div id="card" />
		<label for="phone"> Mobile Number</label>
		<input
			bind:value={phone}
			type="tel"
			id="phone"
			pattern="[0-9 ]+"
			autocomplete="tel"
			placeholder="07000 000 000"
			required
		/>
		<button type="submit">
			{process ? "Processing ..." : "Pay Now"}
		</button>
	</form>
{/if}

<footer style="text-align: center">
	All rights reserved Cat Inhalers @2022
</footer>

<style>
	.gallery {
		display: flex;
	}
	.gallery img {
		height: 15rem;
	}

	apple-pay-button {
		-webkit-appearance: -apple-pay-button;
		cursor: pointer;
		height: 2.5rem;
		width: 10rem;
	}

	form {
		max-width: 20rem;
	}
</style>
