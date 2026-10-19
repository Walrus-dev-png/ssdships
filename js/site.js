/* Inbox that receives load requests. Replace this before you upload the site. */
var DISPATCH_EMAIL = "sheryl@ssdships.com";

var LABELS = {
  name: "Name",
  company: "Company",
  phone: "Phone",
  email: "Email",
  pickup: "Pickup",
  delivery: "Delivery",
  commodity: "Commodity",
  weight: "Weight",
  needed_by: "Needed by",
  notes: "Notes",
};

function ready(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

function validate(data) {
  var errors = {};
  if (!data.name.trim()) errors.name = "Name is required";
  var email = data.email.trim();
  if (!data.phone.trim() && !email) {
    errors.phone = "Phone or email is required";
  } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email";
  }
  if (!data.pickup.trim()) errors.pickup = "Pickup is required";
  if (!data.delivery.trim()) errors.delivery = "Delivery is required";
  return errors;
}

function showErrors(form, errors) {
  form.querySelectorAll("[data-error]").forEach(function (node) {
    node.textContent = "";
  });
  form.querySelectorAll("[aria-invalid]").forEach(function (node) {
    node.removeAttribute("aria-invalid");
  });
  var first = "";
  Object.keys(errors).forEach(function (key) {
    var input = form.querySelector("#" + key);
    var slot = form.querySelector('[data-error="' + key + '"]');
    if (input) input.setAttribute("aria-invalid", "true");
    if (slot) slot.textContent = errors[key];
    if (!first) first = key;
  });
  if (first) {
    var focus = form.querySelector("#" + first);
    if (focus) focus.focus();
  }
}

function readForm(form) {
  var data = {};
  Object.keys(LABELS).forEach(function (key) {
    var input = form.elements[key];
    data[key] = input ? String(input.value || "") : "";
  });
  return data;
}

function showReceipt(form, data) {
  var receipt = document.getElementById("receipt");
  var list = document.getElementById("receipt-list");
  list.replaceChildren();
  Object.keys(LABELS).forEach(function (key) {
    var value = data[key].trim();
    if (!value) return;
    var row = document.createElement("div");
    var dt = document.createElement("dt");
    var dd = document.createElement("dd");
    dt.textContent = LABELS[key];
    dd.textContent = value;
    row.append(dt, dd);
    list.append(row);
  });
  form.hidden = true;
  receipt.hidden = false;
  receipt.focus();
}

ready(function () {
  var form = document.getElementById("load-form");
  if (!form) return;
  var status = document.getElementById("form-status");
  var submit = form.querySelector("[type=submit]");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = readForm(form);
    var errors = validate(data);
    showErrors(form, errors);
    if (Object.keys(errors).length) return;

    var inbox = String(DISPATCH_EMAIL || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inbox)) {
      status.textContent = "Set DISPATCH_EMAIL in js/site.js before this form can send.";
      return;
    }

    if (form.elements._honey && form.elements._honey.value) return;

    submit.disabled = true;
    status.textContent = "Sending…";

    var payload = {
      _subject: "Load request — S&S Logistics",
      _template: "table",
      _captcha: "false",
    };
    Object.keys(LABELS).forEach(function (key) {
      var value = data[key].trim();
      if (value) payload[key] = value;
    });
    if (data.email.trim()) payload._replyto = data.email.trim();

    fetch("https://formsubmit.co/ajax/" + encodeURIComponent(inbox), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        return response.json().then(function (body) {
          if (!response.ok || body.success === false || body.success === "false") {
            throw new Error(body.message || "The inbox did not accept this request.");
          }
          status.textContent = "";
          showReceipt(form, data);
        });
      })
      .catch(function (error) {
        status.textContent = error.message || "Could not send. Try again.";
        submit.disabled = false;
      });
  });

  var edit = document.getElementById("edit-request");
  if (edit) {
    edit.addEventListener("click", function () {
      var receipt = document.getElementById("receipt");
      receipt.hidden = true;
      form.hidden = false;
      submit.disabled = false;
      form.querySelector("#name").focus();
    });
  }
});
