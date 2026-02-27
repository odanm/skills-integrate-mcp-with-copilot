document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const expActivitySelect = document.getElementById("exp-activity");
  const signupForm = document.getElementById("signup-form");
  const experienceForm = document.getElementById("experience-form");
  const messageDiv = document.getElementById("message");
  const expMessageDiv = document.getElementById("exp-message");

  // Function to fetch and render experiences for a given activity card
  async function loadExperiences(activityName, containerEl) {
    try {
      const response = await fetch(`/activities/${encodeURIComponent(activityName)}/experiences`);
      const expList = await response.json();

      if (expList.length === 0) {
        containerEl.innerHTML = "<p><em>No experiences posted yet. Be the first to share!</em></p>";
      } else {
        containerEl.innerHTML = expList
          .map(
            (exp) =>
              `<div class="experience-entry">
                <p class="exp-content">${escapeHtml(exp.content)}</p>
                <p class="exp-meta">— ${escapeHtml(exp.author)} &middot; ${new Date(exp.timestamp).toLocaleDateString()}</p>
              </div>`
          )
          .join("");
      }
    } catch (error) {
      containerEl.innerHTML = "<p><em>Failed to load experiences.</em></p>";
    }
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
      expActivitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          <div class="experiences-container">
            <h5>Experiences & Interviews:</h5>
            <div class="experiences-list">Loading...</div>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Load experiences for this activity card
        const expListEl = activityCard.querySelector(".experiences-list");
        loadExperiences(name, expListEl);

        // Add option to select dropdowns
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        const expOption = document.createElement("option");
        expOption.value = name;
        expOption.textContent = name;
        expActivitySelect.appendChild(expOption);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle experience form submission
  experienceForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const activity = document.getElementById("exp-activity").value;
    const author = document.getElementById("exp-author").value;
    const content = document.getElementById("exp-content").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/experiences`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ author, content }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        expMessageDiv.textContent = "Experience posted successfully!";
        expMessageDiv.className = "success";
        experienceForm.reset();

        // Refresh the experiences list for this activity
        const cards = document.querySelectorAll(".activity-card");
        cards.forEach((card) => {
          if (card.querySelector("h4").textContent.trim() === activity.trim()) {
            const expListEl = card.querySelector(".experiences-list");
            loadExperiences(activity, expListEl);
          }
        });
      } else {
        expMessageDiv.textContent = result.detail || "An error occurred";
        expMessageDiv.className = "error";
      }

      expMessageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        expMessageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      expMessageDiv.textContent = "Failed to post experience. Please try again.";
      expMessageDiv.className = "error";
      expMessageDiv.classList.remove("hidden");
      console.error("Error posting experience:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
