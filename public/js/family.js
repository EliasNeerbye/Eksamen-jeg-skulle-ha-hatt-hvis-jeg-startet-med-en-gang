document.addEventListener("DOMContentLoaded", function () {
    const familyList = document.getElementById("family-list");
    const pendingInvitesList = document.getElementById("pending-invites");
    const inviteForm = document.getElementById("invite-form");
    const shareModalOverlay = document.querySelector(".share-modal-overlay");

    let currentTodoId = null;
    let familyMembers = [];

    function openShareModal(todoId) {
        currentTodoId = todoId;
        if (shareModalOverlay) {
            shareModalOverlay.classList.add("active");
            loadFamilyForSharing();
        }
    }

    function closeShareModal() {
        if (shareModalOverlay) {
            shareModalOverlay.classList.remove("active");
            currentTodoId = null;
        }
    }

    const closeShareModalButtons =
        document.querySelectorAll(".share-modal-close");
    if (closeShareModalButtons.length > 0) {
        closeShareModalButtons.forEach((btn) => {
            btn.addEventListener("click", closeShareModal);
        });
    }

    if (shareModalOverlay) {
        shareModalOverlay.addEventListener("click", function (e) {
            if (e.target === shareModalOverlay) {
                closeShareModal();
            }
        });
    }

    async function loadFamilyForSharing() {
        const familyListModal = document.getElementById("family-list-modal");
        if (!familyListModal) return;

        try {
            await loadFamilyMembers();

            const response = await fetch(`/api/todos/${currentTodoId}`);

            if (!response.ok) {
                throw new Error("Failed to fetch todo details");
            }

            const data = await response.json();
            const todo = data.todo;
            const sharedWith = todo.sharedWith || [];

            familyListModal.innerHTML = "";

            if (familyMembers.length === 0) {
                familyListModal.innerHTML =
                    "<p>You have no family members to share with yet.</p>";
                return;
            }

            familyMembers.forEach((member) => {
                const isShared = sharedWith.includes(member.id);

                const memberItem = document.createElement("div");
                memberItem.className = "family-share-item";

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.id = `share-${member.id}`;
                checkbox.checked = isShared;
                checkbox.dataset.id = member.id;

                const label = document.createElement("label");
                label.htmlFor = `share-${member.id}`;
                label.textContent = `${member.username} (${member.email})`;

                memberItem.appendChild(checkbox);
                memberItem.appendChild(label);
                familyListModal.appendChild(memberItem);
            });

            const allowEditContainer = document.createElement("div");
            allowEditContainer.className = "form-group";

            const allowEditCheckbox = document.createElement("input");
            allowEditCheckbox.type = "checkbox";
            allowEditCheckbox.id = "allow-edit";
            allowEditCheckbox.checked = todo.allowEdit;

            const allowEditLabel = document.createElement("label");
            allowEditLabel.htmlFor = "allow-edit";
            allowEditLabel.textContent =
                "Allow family members to edit this todo";

            allowEditContainer.appendChild(allowEditCheckbox);
            allowEditContainer.appendChild(allowEditLabel);
            familyListModal.appendChild(allowEditContainer);
        } catch (error) {
            console.error("Error loading family for sharing:", error);
            if (familyListModal) {
                familyListModal.innerHTML =
                    '<p class="error-message">Error loading family members</p>';
            }
        }
    }

    async function saveSharing() {
        if (!currentTodoId) return;

        try {
            const checkboxes = document.querySelectorAll(
                '#family-list-modal input[type="checkbox"]:not(#allow-edit)',
            );
            const allowEditCheckbox = document.getElementById("allow-edit");

            const familyMemberIds = Array.from(checkboxes)
                .filter((checkbox) => checkbox.checked)
                .map((checkbox) => checkbox.dataset.id);

            const allowEdit = allowEditCheckbox
                ? allowEditCheckbox.checked
                : false;

            const response = await fetch("/api/family/share", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    todoId: currentTodoId,
                    familyMemberIds,
                    allowEdit,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update sharing settings");
            }

            closeShareModal();
            showFeedback("Sharing settings updated successfully", "success");
        } catch (error) {
            console.error("Error saving sharing settings:", error);
            showFeedback(
                "Failed to update sharing settings: " + error.message,
                "error",
            );
        }
    }

    function showFeedback(message, type) {
        const feedbackElement = document.createElement("div");
        feedbackElement.className = `feedback ${type}`;
        feedbackElement.textContent = message;
        feedbackElement.style.position = "fixed";
        feedbackElement.style.top = "20px";
        feedbackElement.style.left = "50%";
        feedbackElement.style.transform = "translateX(-50%)";
        feedbackElement.style.zIndex = "9999";

        document.body.appendChild(feedbackElement);

        setTimeout(() => {
            feedbackElement.remove();
        }, 3000);
    }

    const saveShareBtn = document.getElementById("save-share-btn");
    if (saveShareBtn) {
        saveShareBtn.addEventListener("click", saveSharing);
    }

    function addShareButtons() {
        const todoItems = document.querySelectorAll(
            ".todo-item:not(.todo-shared)",
        );

        todoItems.forEach((item) => {
            const todoId = item.dataset.id;
            const actionsDiv = item.querySelector(".todo-actions");

            if (actionsDiv && !actionsDiv.querySelector(".share-btn")) {
                const shareBtn = document.createElement("button");
                shareBtn.className = "share-btn";
                shareBtn.title = "Share with family";
                shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
                shareBtn.addEventListener("click", () =>
                    openShareModal(todoId),
                );

                actionsDiv.appendChild(shareBtn);
            }
        });
    }

    async function loadFamilyMembers() {
        if (!familyList && !document.getElementById("family-list-modal"))
            return;

        try {
            const response = await fetch("/api/family/members");

            if (!response.ok) {
                throw new Error("Failed to fetch family members");
            }

            const data = await response.json();
            familyMembers = data.familyMembers || [];

            if (familyList) {
                familyList.innerHTML = "";

                if (familyMembers.length === 0) {
                    familyList.innerHTML =
                        "<p>You have no family members yet.</p>";
                    return;
                }

                familyMembers.forEach((member) => {
                    const memberItem = document.createElement("div");
                    memberItem.className = "family-item";

                    const memberInfo = document.createElement("div");
                    memberInfo.className = "family-info";

                    const memberName = document.createElement("div");
                    memberName.className = "family-name";
                    memberName.textContent = member.username;

                    const memberEmail = document.createElement("div");
                    memberEmail.className = "family-email";
                    memberEmail.textContent = member.email;

                    memberInfo.appendChild(memberName);
                    memberInfo.appendChild(memberEmail);

                    const memberActions = document.createElement("div");
                    memberActions.className = "family-actions";

                    const removeBtn = document.createElement("button");
                    removeBtn.className = "btn btn-secondary";
                    removeBtn.innerHTML =
                        '<i class="fas fa-user-minus"></i> Remove';
                    removeBtn.addEventListener("click", () =>
                        removeFamilyMember(member.id),
                    );

                    memberActions.appendChild(removeBtn);

                    memberItem.appendChild(memberInfo);
                    memberItem.appendChild(memberActions);

                    familyList.appendChild(memberItem);
                });
            }

            return familyMembers;
        } catch (error) {
            console.error("Error loading family members:", error);
            if (familyList) {
                familyList.innerHTML =
                    '<p class="error-message">Error loading family members</p>';
            }
            return [];
        }
    }

    async function loadPendingInvites() {
        if (!pendingInvitesList) return;

        try {
            const response = await fetch("/api/family/invitations");

            if (!response.ok) {
                throw new Error("Failed to fetch pending invitations");
            }

            const data = await response.json();
            const pendingInvitations = data.pendingInvitations || [];

            pendingInvitesList.innerHTML = "";

            if (pendingInvitations.length === 0) {
                pendingInvitesList.innerHTML = "<p>No pending invitations.</p>";
                return;
            }

            pendingInvitations.forEach((invite) => {
                const inviteItem = document.createElement("div");
                inviteItem.className = "invite-item";

                const inviteInfo = document.createElement("div");
                inviteInfo.className = "invite-info";
                inviteInfo.textContent = `${invite.user.username} (${invite.user.email}) has invited you to join their family`;

                const inviteActions = document.createElement("div");
                inviteActions.className = "invite-actions";

                const acceptBtn = document.createElement("button");
                acceptBtn.className = "btn";
                acceptBtn.innerHTML = '<i class="fas fa-check"></i> Accept';
                acceptBtn.addEventListener("click", () =>
                    respondToInvite(invite._id, "accepted"),
                );

                const rejectBtn = document.createElement("button");
                rejectBtn.className = "btn btn-secondary";
                rejectBtn.innerHTML = '<i class="fas fa-times"></i> Reject';
                rejectBtn.addEventListener("click", () =>
                    respondToInvite(invite._id, "rejected"),
                );

                inviteActions.appendChild(acceptBtn);
                inviteActions.appendChild(rejectBtn);

                inviteItem.appendChild(inviteInfo);
                inviteItem.appendChild(inviteActions);

                pendingInvitesList.appendChild(inviteItem);
            });
        } catch (error) {
            console.error("Error loading pending invitations:", error);
            if (pendingInvitesList) {
                pendingInvitesList.innerHTML =
                    '<p class="error-message">Error loading invitations</p>';
            }
        }
    }

    async function inviteFamilyMember(email) {
        try {
            const response = await fetch("/api/family/invite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                showFeedback("Invitation sent successfully", "success");

                const inviteInput = document.getElementById("invite-email");
                if (inviteInput) {
                    inviteInput.value = "";
                }
            } else {
                showFeedback(
                    data.message || "Failed to send invitation",
                    "error",
                );
            }
        } catch (error) {
            console.error("Error sending invitation:", error);
            showFeedback("Error sending invitation", "error");
        }
    }

    async function respondToInvite(invitationId, action) {
        try {
            const response = await fetch("/api/family/respond", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ invitationId, action }),
            });

            if (!response.ok) {
                throw new Error("Failed to respond to invitation");
            }

            showFeedback(
                `Invitation ${
                    action === "accepted" ? "accepted" : "rejected"
                } successfully`,
                "success",
            );

            loadPendingInvites();
            loadFamilyMembers();
        } catch (error) {
            console.error("Error responding to invitation:", error);
            showFeedback(
                "Error responding to invitation: " + error.message,
                "error",
            );
        }
    }

    async function removeFamilyMember(familyMemberId) {
        if (!confirm("Are you sure you want to remove this family member?")) {
            return;
        }

        try {
            const response = await fetch(
                `/api/family/members/${familyMemberId}`,
                {
                    method: "DELETE",
                },
            );

            if (!response.ok) {
                throw new Error("Failed to remove family member");
            }

            showFeedback("Family member removed successfully", "success");

            loadFamilyMembers();
        } catch (error) {
            console.error("Error removing family member:", error);
            showFeedback(
                "Error removing family member: " + error.message,
                "error",
            );
        }
    }

    if (inviteForm) {
        inviteForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const email = document.getElementById("invite-email").value;
            inviteFamilyMember(email);
        });
    }

    loadFamilyMembers();
    loadPendingInvites();

    if (document.getElementById("todo-list")) {
        const todoListObserver = new MutationObserver(addShareButtons);
        todoListObserver.observe(document.getElementById("todo-list"), {
            childList: true,
        });

        addShareButtons();
    }
});
